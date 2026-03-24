import React from "react";
import { vi } from "vitest";

vi.mock("react-native", () => {
  function normalizeProps(props: Record<string, unknown>) {
    const { style, placeholderTextColor, onPress, onChangeText, ...rest } = props;

    return {
      ...rest,
      style:
        Array.isArray(style) || typeof style !== "object"
          ? undefined
          : (style as Record<string, unknown>),
      onClick: onPress as (() => void) | undefined,
      onChangeText: onChangeText as ((value: string) => void) | undefined,
    };
  }

  const createWrapper = (tag: "div" | "span" | "button" | "input") =>
    React.forwardRef<
      HTMLElement,
      Record<string, unknown> & { children?: React.ReactNode }
    >(({ children, ...props }, ref) =>
      React.createElement(tag, { ...normalizeProps(props), ref }, children)
    );

  const TextInput = React.forwardRef<
    HTMLInputElement,
    Record<string, unknown> & {
      value?: string;
      onChangeText?: (value: string) => void;
    }
  >(({ onChangeText, ...props }, ref) =>
    React.createElement("input", {
      ...normalizeProps(props),
      ref,
      onChange: (event: Event) => {
        const target = event.target as HTMLInputElement;
        onChangeText?.(target.value);
      },
    })
  );

  return {
    View: createWrapper("div"),
    Text: createWrapper("span"),
    Pressable: React.forwardRef<
      HTMLButtonElement,
      Record<string, unknown> & {
        children?: React.ReactNode;
        onPress?: () => void;
      }
    >(({ children, onPress, ...props }, ref) =>
      React.createElement(
        "button",
        { ...normalizeProps({ ...props, onPress }), ref },
        children
      )
    ),
    TextInput,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
    },
  };
});

vi.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}));
