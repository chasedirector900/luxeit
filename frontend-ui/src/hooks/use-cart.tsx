"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  EMPTY_CART,
  clearCartState,
  readCartState,
  writeCartState,
} from "@/lib/cart/cart-storage";
import type { AddCartItemInput, CartItem, CartState } from "@/types/cart";

type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "ADD_ITEM"; payload: AddCartItemInput }
  | {
      type: "REMOVE_ITEM";
      payload: {
        productId: string;
        variantId?: string | null;
        selectedOptions?: Record<string, string>;
      };
    }
  | {
      type: "UPDATE_QUANTITY";
      payload: {
        productId: string;
        variantId?: string | null;
        selectedOptions?: Record<string, string>;
        quantity: number;
      };
    }
  | { type: "CLEAR" };

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addItem: (input: AddCartItemInput) => void;
  removeItem: (
    productId: string,
    variantId?: string | null,
    selectedOptions?: Record<string, string>,
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
    selectedOptions?: Record<string, string>,
  ) => void;
  incrementQuantity: (
    productId: string,
    variantId?: string | null,
    selectedOptions?: Record<string, string>,
  ) => void;
  decrementQuantity: (
    productId: string,
    variantId?: string | null,
    selectedOptions?: Record<string, string>,
  ) => void;
  clearCart: () => void;
};

type CartInternalState = CartState & { hydrated: boolean };

const CartContext = createContext<CartContextValue | null>(null);

function serializeSelectedOptions(selectedOptions?: Record<string, string>) {
  if (!selectedOptions) return "";
  const pairs = Object.entries(selectedOptions)
    .filter(([, value]) => Boolean(value))
    .sort(([a], [b]) => a.localeCompare(b));
  return pairs.map(([key, value]) => `${key}:${value}`).join("|");
}

function getItemKey(
  productId: string,
  variantId?: string | null,
  selectedOptions?: Record<string, string>,
) {
  return `${productId}::${variantId ?? "default"}::${serializeSelectedOptions(selectedOptions)}`;
}

function normalizeQuantity(quantity?: number) {
  if (!quantity || Number.isNaN(quantity)) return 1;
  return Math.max(1, Math.floor(quantity));
}

function reducer(state: CartInternalState, action: CartAction): CartInternalState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.payload.items, hydrated: true };
    case "ADD_ITEM": {
      const quantity = normalizeQuantity(action.payload.quantity);
      const key = getItemKey(
        action.payload.productId,
        action.payload.variantId,
        action.payload.selectedOptions,
      );
      const existingIndex = state.items.findIndex(
        (item) => getItemKey(item.productId, item.variantId, item.selectedOptions) === key,
      );

      if (existingIndex >= 0) {
        const nextItems = [...state.items];
        const current = nextItems[existingIndex];
        nextItems[existingIndex] = { ...current, quantity: current.quantity + quantity };
        return { ...state, items: nextItems };
      }

      const nextItem: CartItem = {
        ...action.payload,
        variantId: action.payload.variantId ?? null,
        deliveryEstimate: action.payload.deliveryEstimate ?? null,
        quantity,
      };
      return { ...state, items: [...state.items, nextItem] };
    }
    case "REMOVE_ITEM": {
      const key = getItemKey(
        action.payload.productId,
        action.payload.variantId,
        action.payload.selectedOptions,
      );
      return {
        ...state,
        items: state.items.filter(
          (item) => getItemKey(item.productId, item.variantId, item.selectedOptions) !== key,
        ),
      };
    }
    case "UPDATE_QUANTITY": {
      const key = getItemKey(
        action.payload.productId,
        action.payload.variantId,
        action.payload.selectedOptions,
      );
      const quantity = Math.max(0, Math.floor(action.payload.quantity));
      if (quantity === 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => getItemKey(item.productId, item.variantId, item.selectedOptions) !== key,
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          getItemKey(item.productId, item.variantId, item.selectedOptions) === key
            ? { ...item, quantity }
            : item,
        ),
      };
    }
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

const initialState: CartInternalState = { ...EMPTY_CART, hydrated: false };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: readCartState() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    writeCartState({ items: state.items });
  }, [state.hydrated, state.items]);

  const value = useMemo<CartContextValue>(() => {
    const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartSubtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const addItem = (input: AddCartItemInput) => dispatch({ type: "ADD_ITEM", payload: input });

    const removeItem = (
      productId: string,
      variantId?: string | null,
      selectedOptions?: Record<string, string>,
    ) => dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId, selectedOptions } });

    const updateQuantity = (
      productId: string,
      quantity: number,
      variantId?: string | null,
      selectedOptions?: Record<string, string>,
    ) =>
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, variantId, selectedOptions, quantity },
      });

    const incrementQuantity = (
      productId: string,
      variantId?: string | null,
      selectedOptions?: Record<string, string>,
    ) => {
      const match = state.items.find(
        (item) =>
          getItemKey(item.productId, item.variantId, item.selectedOptions) ===
          getItemKey(productId, variantId, selectedOptions),
      );
      if (!match) return;
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, variantId, selectedOptions, quantity: match.quantity + 1 },
      });
    };

    const decrementQuantity = (
      productId: string,
      variantId?: string | null,
      selectedOptions?: Record<string, string>,
    ) => {
      const match = state.items.find(
        (item) =>
          getItemKey(item.productId, item.variantId, item.selectedOptions) ===
          getItemKey(productId, variantId, selectedOptions),
      );
      if (!match) return;
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { productId, variantId, selectedOptions, quantity: match.quantity - 1 },
      });
    };

    const clearCart = () => {
      clearCartState();
      dispatch({ type: "CLEAR" });
    };

    return {
      items: state.items,
      cartCount,
      cartSubtotal,
      addItem,
      removeItem,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      clearCart,
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
