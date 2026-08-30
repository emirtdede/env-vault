import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TitleBar } from "./TitleBar";

describe("TitleBar Header Controls", () => {
  it("renders both Theme button and Language button side-by-side", () => {
    render(<TitleBar />);

    const themeBtn = screen.getByLabelText(/tema|theme/i);
    const langBtn = screen.getByLabelText(/dil|language/i);

    expect(themeBtn).toBeInTheDocument();
    expect(langBtn).toBeInTheDocument();
  });
});
