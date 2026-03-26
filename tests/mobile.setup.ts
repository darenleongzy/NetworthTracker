import React from "react";
import { vi } from "vitest";

vi.mock("react-native", () => {
  type MockChildrenProps = {
    children?: React.ReactNode;
  } & Record<string, unknown>;

  function normalizeProps(props: Record<string, unknown>) {
    const {
      style,
      onPress,
      onChangeText,
      testID,
      accessibilityLabel,
      ...rest
    } = props;

    return {
      ...rest,
      "data-testid": testID as string | undefined,
      "aria-label": accessibilityLabel as string | undefined,
      style:
        Array.isArray(style) || typeof style !== "object"
          ? undefined
          : (style as Record<string, unknown>),
      onClick: onPress as (() => void) | undefined,
      onChangeText: onChangeText as ((value: string) => void) | undefined,
    };
  }

  const createWrapper = (tag: "div" | "span" | "button" | "input") =>
    {
      const Wrapped = React.forwardRef<
      HTMLElement,
      MockChildrenProps
    >(({ children, ...props }: MockChildrenProps, ref) =>
      React.createElement(tag, { ...normalizeProps(props), ref }, children as React.ReactNode)
    );
      Wrapped.displayName = `Mock${tag}`;
      return Wrapped;
    };

  const TextInput = React.forwardRef<
    HTMLInputElement,
    Record<string, unknown> & {
      value?: string;
      onChangeText?: (value: string) => void;
    }
  >(
    (
      {
        onChangeText,
        ...props
      }: Record<string, unknown> & {
        value?: string;
        onChangeText?: (value: string) => void;
      },
      ref
    ) =>
    React.createElement("input", {
      ...normalizeProps(props),
      ref,
      onChange: (event: Event) => {
        const target = event.target as HTMLInputElement;
        onChangeText?.(target.value);
      },
    })
  );
  TextInput.displayName = "MockTextInput";

  const Pressable = React.forwardRef<
    HTMLButtonElement,
    MockChildrenProps & {
      children?: React.ReactNode;
      onPress?: () => void;
    }
  >(({ children, onPress, ...props }, ref) =>
    React.createElement(
      "button",
      { ...normalizeProps({ ...props, onPress }), ref },
      children as React.ReactNode
    )
  );
  Pressable.displayName = "MockPressable";

  return {
    View: createWrapper("div"),
    Text: createWrapper("span"),
    ScrollView: createWrapper("div"),
    ActivityIndicator: createWrapper("div"),
    RefreshControl: createWrapper("div"),
    Pressable,
    TextInput,
    StyleSheet: {
      create: <T,>(styles: T) => styles,
    },
    Linking: {
      openURL: vi.fn(),
    },
  };
});

vi.mock("react-native/Libraries/Animated/NativeAnimatedHelper", () => ({}));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: Object.assign(
    ({ children }: { children?: React.ReactNode }) =>
      React.createElement("div", null, children as React.ReactNode),
    { displayName: "MockSafeAreaView" }
  ),
}));
