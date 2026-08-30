import { describe, it, expect } from "vitest";
import { useEditorStore } from "./useEditorStore";

describe("useEditorStore", () => {
  it("starts in a clean closed state", () => {
    const state = useEditorStore.getState();
    expect(state.activeDocId).toBeNull();
    expect(state.rawContent).toBe("");
    expect(state.isDirty).toBe(false);
  });

  it("updates content and tracks dirty state", () => {
    useEditorStore.setState({
      activeDocId: "doc-1",
      filename: ".env",
      initialContent: "PORT=3000\n",
      rawContent: "PORT=3000\n",
      isDirty: false,
    });

    useEditorStore.getState().setContent("PORT=8080\n");
    expect(useEditorStore.getState().rawContent).toBe("PORT=8080\n");
    expect(useEditorStore.getState().isDirty).toBe(true);

    // Reverting to initial content marks not dirty
    useEditorStore.getState().setContent("PORT=3000\n");
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it("purges secret memory when closed", () => {
    useEditorStore.setState({
      activeDocId: "doc-1",
      filename: ".env",
      initialContent: "SECRET=super-confidential\n",
      rawContent: "SECRET=super-confidential\n",
      isDirty: false,
    });

    useEditorStore.getState().closeDocument();

    const state = useEditorStore.getState();
    expect(state.activeDocId).toBeNull();
    expect(state.rawContent).toBe("");
    expect(state.initialContent).toBe("");
  });
});
