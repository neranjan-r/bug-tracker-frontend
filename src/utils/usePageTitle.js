import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - Bug Tracker` : "Bug Tracker";
  }, [title]);
}

