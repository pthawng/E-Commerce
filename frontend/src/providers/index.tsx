import { ThemeProviders } from "./ThemeProvider";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <ThemeProviders>
        {children}
    </ThemeProviders>
  );
};
