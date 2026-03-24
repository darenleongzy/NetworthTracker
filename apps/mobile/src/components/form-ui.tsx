import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { appTheme } from "@track-my-worth/config";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function FormInput(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={appTheme.colors.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function ChipSelector<T extends string>({
  options,
  value,
  onChange,
  testID,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={testID ? `${testID}-${option.value}` : undefined}
            accessibilityLabel={option.label}
            style={[
              styles.chip,
              selected && styles.chipActive,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = "primary",
  testID,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger" | "neutral";
  testID?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.button,
        tone === "danger"
          ? styles.buttonDanger
          : tone === "neutral"
            ? styles.buttonNeutral
            : styles.buttonPrimary,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.buttonText,
          tone === "danger" && styles.buttonTextDanger,
          tone === "neutral" && styles.buttonTextNeutral,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  hint: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceMuted,
    color: appTheme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: appTheme.spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipActive: {
    borderColor: appTheme.colors.primary,
    backgroundColor: "#ede9fe",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: appTheme.colors.textMuted,
  },
  chipTextActive: {
    color: appTheme.colors.primaryDeep,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: appTheme.colors.primary,
  },
  buttonNeutral: {
    backgroundColor: appTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  buttonDanger: {
    backgroundColor: "#fee2e2",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonTextNeutral: {
    color: appTheme.colors.text,
  },
  buttonTextDanger: {
    color: "#b91c1c",
  },
});
