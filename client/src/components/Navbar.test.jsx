import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";

// ─── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLogout = vi.fn();

function setupAuth({ user = null, cart = { itemCount: 0 } } = {}) {
  useAuth.mockReturnValue({ user, loading: false, logout: mockLogout });
  useCart.mockReturnValue({ cart, loading: false });
}

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  it("should always render the ShopSmart brand link", () => {
    setupAuth();
    renderNavbar();

    expect(screen.getByText("ShopSmart")).toBeInTheDocument();
  });

  it("should always show a Products navigation link", () => {
    setupAuth();
    renderNavbar();

    expect(screen.getByRole("link", { name: /Products/i })).toBeInTheDocument();
  });

  it("should render search input", () => {
    setupAuth();
    renderNavbar();

    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  // ── Unauthenticated State ─────────────────────────────────────────────────

  describe("when user is NOT logged in", () => {
    beforeEach(() => setupAuth({ user: null }));

    it("should show Login link", () => {
      renderNavbar();
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    });

    it("should show Sign Up link", () => {
      renderNavbar();
      expect(
        screen.getByRole("link", { name: /sign up/i }),
      ).toBeInTheDocument();
    });

    it("should NOT show My Orders, Logout, or user greeting", () => {
      renderNavbar();
      expect(screen.queryByText(/My Orders/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /logout/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument();
    });

    it("should NOT show cart badge", () => {
      setupAuth({ user: null, cart: { itemCount: 5 } });
      renderNavbar();
      // Cart link only shows with user logged in, so no badge
      expect(screen.queryByText("5")).not.toBeInTheDocument();
    });
  });

  // ── Authenticated State ───────────────────────────────────────────────────

  describe("when user IS logged in", () => {
    const user = { id: 1, name: "Alice Smith" };

    beforeEach(() => setupAuth({ user, cart: { itemCount: 0 } }));

    it("should show user greeting with first name", () => {
      renderNavbar();
      expect(screen.getByText("Hi, Alice")).toBeInTheDocument();
    });

    it("should show My Orders link", () => {
      renderNavbar();
      expect(
        screen.getByRole("link", { name: /my orders/i }),
      ).toBeInTheDocument();
    });

    it("should show Logout button", () => {
      renderNavbar();
      expect(
        screen.getByRole("button", { name: /logout/i }),
      ).toBeInTheDocument();
    });

    it("should NOT show Login or Sign Up links", () => {
      renderNavbar();
      expect(
        screen.queryByRole("link", { name: /login/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /sign up/i }),
      ).not.toBeInTheDocument();
    });

    it("should show cart badge when itemCount > 0", () => {
      setupAuth({ user, cart: { itemCount: 3 } });
      renderNavbar();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should NOT show cart badge when itemCount is 0", () => {
      setupAuth({ user, cart: { itemCount: 0 } });
      renderNavbar();
      expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("should call logout and navigate to / on Logout click", async () => {
      renderNavbar();

      await userEvent.click(screen.getByRole("button", { name: /logout/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  // ── Search ────────────────────────────────────────────────────────────────

  describe("search interaction", () => {
    it("should navigate to products page with search query on Enter", async () => {
      setupAuth();
      renderNavbar();

      const input = screen.getByPlaceholderText(/search products/i);
      await userEvent.type(input, "laptop");
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockNavigate).toHaveBeenCalledWith("/products?search=laptop");
    });

    it("should NOT navigate on Enter when input is empty", async () => {
      setupAuth();
      renderNavbar();

      const input = screen.getByPlaceholderText(/search products/i);
      fireEvent.keyDown(input, { key: "Enter" });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should NOT navigate on other key presses", async () => {
      setupAuth();
      renderNavbar();

      const input = screen.getByPlaceholderText(/search products/i);
      await userEvent.type(input, "lap");
      fireEvent.keyDown(input, { key: "a" });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
