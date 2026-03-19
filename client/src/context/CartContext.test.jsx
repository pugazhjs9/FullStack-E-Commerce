import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import * as api from "../services/api";

// ─── Mock API modules ─────────────────────────────────────────────────────────

vi.mock("../services/api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
  cartApi: {
    get: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}));

// ─── Helper Component ─────────────────────────────────────────────────────────

function TestConsumer() {
  const {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  return (
    <div>
      <div data-testid="item-count">{cart.itemCount}</div>
      <div data-testid="subtotal">{cart.subtotal}</div>
      <div data-testid="loading">{loading ? "loading" : "ready"}</div>
      <button onClick={() => addToCart(1, 1)}>Add</button>
      <button onClick={() => updateQuantity(1, 3)}>Update</button>
      <button onClick={() => removeFromCart(1)}>Remove</button>
      <button onClick={() => clearCart()}>Clear</button>
    </div>
  );
}

function renderWithProviders(user = null) {
  // Set up auth state in localStorage if user provided
  if (user) {
    localStorage.setItem("token", "token_1_12345");
  }
  api.authApi.getMe.mockResolvedValue(user);

  return render(
    <AuthProvider>
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    </AuthProvider>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const mockCartData = {
  items: [
    {
      productId: 1,
      quantity: 2,
      product: { id: 1, name: "Laptop", price: 999.99 },
    },
  ],
  itemCount: 2,
  subtotal: 1999.98,
};
const emptyCartData = { items: [], itemCount: 0, subtotal: 0 };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  api.authApi.getMe.mockResolvedValue(null);
  api.cartApi.get.mockResolvedValue(emptyCartData);
  api.cartApi.add.mockResolvedValue({ message: "Added" });
  api.cartApi.update.mockResolvedValue({ message: "Updated" });
  api.cartApi.remove.mockResolvedValue({ message: "Removed" });
  api.cartApi.clear.mockResolvedValue({ message: "Cleared" });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CartContext", () => {
  it("should start with empty cart when user is not logged in", async () => {
    renderWithProviders(null);

    await waitFor(() => {
      expect(screen.getByTestId("item-count").textContent).toBe("0");
    });
    expect(api.cartApi.get).not.toHaveBeenCalled();
  });

  it("should fetch cart when user logs in", async () => {
    api.cartApi.get.mockResolvedValue(mockCartData);

    renderWithProviders({ id: 1, name: "Alice" });

    await waitFor(() => {
      expect(screen.getByTestId("item-count").textContent).toBe("2");
    });
    expect(api.cartApi.get).toHaveBeenCalledTimes(1);
  });

  it("should call cartApi.add and refresh cart on addToCart", async () => {
    api.cartApi.get
      .mockResolvedValueOnce(emptyCartData)
      .mockResolvedValueOnce(mockCartData);

    renderWithProviders({ id: 1, name: "Alice" });
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("ready"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Add"));
    });

    expect(api.cartApi.add).toHaveBeenCalledWith(1, 1);
    expect(api.cartApi.get).toHaveBeenCalledTimes(2);
  });

  it("should NOT call cartApi.add when user is not logged in", async () => {
    renderWithProviders(null);
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("ready"),
    );

    // cartApi.add should NOT have been called since no user is logged in
    // We verify by checking state: cart should remain empty and add was never invoked
    expect(api.cartApi.add).not.toHaveBeenCalled();
    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("should call cartApi.update and refresh cart on updateQuantity", async () => {
    api.cartApi.get.mockResolvedValue(mockCartData);

    renderWithProviders({ id: 1, name: "Alice" });
    await waitFor(() =>
      expect(screen.getByTestId("item-count").textContent).toBe("2"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Update"));
    });

    expect(api.cartApi.update).toHaveBeenCalledWith(1, 3);
  });

  it("should call cartApi.remove and refresh cart on removeFromCart", async () => {
    api.cartApi.get.mockResolvedValue(mockCartData);

    renderWithProviders({ id: 1, name: "Alice" });
    await waitFor(() =>
      expect(screen.getByTestId("item-count").textContent).toBe("2"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Remove"));
    });

    expect(api.cartApi.remove).toHaveBeenCalledWith(1);
  });

  it("should reset cart state and call cartApi.clear on clearCart", async () => {
    api.cartApi.get.mockResolvedValue(mockCartData);

    renderWithProviders({ id: 1, name: "Alice" });
    await waitFor(() =>
      expect(screen.getByTestId("item-count").textContent).toBe("2"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Clear"));
    });

    expect(api.cartApi.clear).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByTestId("item-count").textContent).toBe("0");
    });
  });

  it("should throw error from useCart when used outside CartProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadConsumer() {
      useCart();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(/CartProvider/i);
    consoleSpy.mockRestore();
  });
});
