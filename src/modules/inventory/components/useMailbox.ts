import { useCallback, useEffect, useState } from "react";
import {
  loadStockAlerts,
  loadNotices,
  type StockAlert,
  type ReplenishmentNotice,
} from "../services/notifications";

export function useMailbox() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [notices, setNotices] = useState<ReplenishmentNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertError, setAlertError] = useState("");
  const [noticeError, setNoticeError] = useState("");
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    let fetching = false;
    async function load() {
      if (fetching) return;
      fetching = true;
      const [stock, mailbox] = await Promise.allSettled([
        loadStockAlerts(),
        loadNotices(),
      ]);
      if (active) {
        if (stock.status === "fulfilled") {
          setAlerts(stock.value);
          setAlertError("");
        } else setAlertError("No se pudieron actualizar las alertas de stock.");
        if (mailbox.status === "fulfilled") {
          setNotices(mailbox.value);
          setNoticeError("");
        } else
          setNoticeError(
            mailbox.reason instanceof Error
              ? mailbox.reason.message
              : "No se pudo cargar el buzón.",
          );
        setLoading(false);
      }
      fetching = false;
    }
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("inventory-mailbox-change", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("inventory-mailbox-change", refresh);
    };
  }, [version]);
  return { alerts, notices, loading, alertError, noticeError, reload };
}
