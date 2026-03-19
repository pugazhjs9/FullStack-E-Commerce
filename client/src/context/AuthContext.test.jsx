import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../context/AuthContext";
import * as api from "../services/api";

// ─── Mock the API module ──────────────────────────────────────────────────────

vi.mock("../services/api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
}));

// ─── Helper Component ─────────────────────────────────────────────────────────

function TestConsumer() {
  const { user, loading, login, logout, register } = useAuth();
  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.name : "no-user"}</div>
      <button onClick={() => login("a@a.com", "pass")}>Login</button>
      <button onClick={() => register("Alice", "a@a.com", "pass")}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // By default, getMe will be called only if there's a token
  api.authApi.getMe.mockResolvedValue({
    id: 1,
    name: "Alice",
    email: "a@a.com",
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthContext", () => {
  it("should start with no user and finish loading when no token", async () => {
    renderWithAuth();

    // Initially might be loading
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    expect(screen.getByTestId("user").textContent).toBe("no-user");
  });

  it("should auto-login from stored token on mount", async () => {
    localStorage.setItem("token", "token_1_12345");

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Alice");
    });

    expect(api.authApi.getMe).toHaveBeenCalledTimes(1);
  });

  it("should clear token if getMe fails on mount", async () => {
    localStorage.setItem("token", "bad_token");
    api.authApi.getMe.mockRejectedValueOnce(new Error("Invalid token"));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    expect(screen.getByTestId("user").textContent).toBe("no-user");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should set user and store token in localStorage on login", async () => {
    api.authApi.login.mockResolvedValue({
      token: "token_1_12345",
      user: { id: 1, name: "Alice", email: "a@a.com" },
    });

    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("ready"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Alice");
    });
    expect(localStorage.getItem("token")).toBe("token_1_12345");
  });

  it("should clear user and localStorage on logout", async () => {
    localStorage.setItem("token", "token_1_12345");

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Alice");
    });

    await act(async () => {
      await userEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("user").textContent).toBe("no-user");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("should set user and store token in localStorage on register", async () => {
    api.authApi.register.mockResolvedValue({
      token: "token_2_99999",
      user: { id: 2, name: "Alice", email: "a@a.com" },
    });

    renderWithAuth();

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("ready"),
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Register"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("Alice");
    });
    expect(localStorage.getItem("token")).toBe("token_2_99999");
  });

  it("should throw error from useAuth when used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BadConsumer() {
      useAuth();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(/AuthProvider/i);

    consoleSpy.mockRestore();
  });
});
