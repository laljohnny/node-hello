import { ReactNode, useEffect } from "react";
import { useLayoutContext } from "./Layout";

interface PageWithTitleProps {
  title: string;
  children: ReactNode;
}

const PageWithTitle = ({ title, children }: PageWithTitleProps) => {
  const { setHeaderTitle } = useLayoutContext();

  useEffect(() => {
    setHeaderTitle(title);
  }, [setHeaderTitle, title]);

  return <>{children}</>;
};

export default PageWithTitle;
