import { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { GlassSurface } from "./GlassSurface";
import { Button } from "./Button";
import { usePreferencesStore } from "../../stores/usePreferencesStore";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const language = usePreferencesStore.getState().language || "tr";
      const isTr = language === "tr";

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--app-bg, #0B0B0D)",
            color: "var(--text-primary, #FFFFFF)",
            padding: "24px",
          }}
        >
          <GlassSurface
            intensity="strong"
            blur="lg"
            borderRadius="16px"
            style={{
              maxWidth: "480px",
              padding: "32px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "rgba(229, 72, 77, 0.12)",
                color: "#E5484D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldAlert size={32} />
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>
              {isTr ? "Beklenmeyen Bir Hata Oluştu" : "An Unexpected Error Occurred"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary, #A4A4AA)", lineHeight: 1.5 }}>
              {this.state.error?.message || (isTr ? "Arayüz yüklenirken bir sorun meydana geldi." : "A problem occurred while rendering the interface.")}
            </p>

            <Button
              variant="primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              leftIcon={<RefreshCw size={16} />}
            >
              {isTr ? "Yeniden Başlat" : "Restart App"}
            </Button>
          </GlassSurface>
        </div>
      );
    }

    return this.props.children;
  }
}
