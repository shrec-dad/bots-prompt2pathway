import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSettings } from "@/store/settingsSlice";
import { applyTheme } from "@/lib/theme";
import type { RootState } from "@/store";

export default function ThemeManager() {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings.data);

  useEffect(() => {
    dispatch(fetchSettings("global"));
  }, [dispatch]);

  useEffect(() => {
    if (settings?.palette) {
      applyTheme(settings.palette);
    }
  }, [status, settings]);

  return null;
}
