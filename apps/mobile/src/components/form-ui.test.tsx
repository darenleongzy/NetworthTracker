import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChipSelector, Field, FormInput, PrimaryButton } from "./form-ui";

function ChipHarness() {
  const [value, setValue] = useState<"cash" | "investment">("cash");

  return (
    <div>
      <ChipSelector
        value={value}
        onChange={setValue}
        options={[
          { label: "Cash", value: "cash" },
          { label: "Brokerage", value: "investment" },
        ]}
      />
      <span>{value}</span>
    </div>
  );
}

describe("mobile form ui", () => {
  it("renders field labels and text inputs", () => {
    render(
      <Field label="Account name" hint="Shown on mobile">
        <FormInput value="DBS" onChangeText={() => undefined} />
      </Field>
    );

    expect(screen.getByText("Account name")).toBeTruthy();
    expect(screen.getByText("Shown on mobile")).toBeTruthy();
    expect(screen.getByDisplayValue("DBS")).toBeTruthy();
  });

  it("updates chip selector values when pressed", () => {
    render(<ChipHarness />);

    fireEvent.click(screen.getByText("Brokerage"));

    expect(screen.getByText("investment")).toBeTruthy();
  });

  it("calls primary button handlers", () => {
    const onPress = vi.fn();
    render(<PrimaryButton label="Save settings" onPress={onPress} />);

    fireEvent.click(screen.getByText("Save settings"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
