import { createContext, useContext, useState } from "react";

type AnalysisStateContextType = {
  triggerAnalysis: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
};

const AnalysisStateContext = createContext<AnalysisStateContextType | null>(
  null
);

export function useAnalysisState() {
  const context = useContext(AnalysisStateContext);
  if (!context) {
    throw new Error(
      "useAnalysisState must be used within AnalysisStateProvider"
    );
  }
  return context;
}

export function AnalysisStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const triggerAnalysis = () => {
    setIsAnalyzing(true);
  };

  return (
    <AnalysisStateContext.Provider
      value={{
        triggerAnalysis,
        isAnalyzing,
        setIsAnalyzing,
      }}
    >
      {children}
    </AnalysisStateContext.Provider>
  );
}
