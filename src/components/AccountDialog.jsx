import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Cloud, CloudCheck, CloudOff, LoaderCircle, LogOut, Mail, RefreshCcw, X } from "lucide-react";

function statusCopy(cloud) {
  if (!cloud.configured) return "仅保存在本机";
  if (!cloud.authReady || cloud.syncStatus === "loading") return "正在检查登录状态";
  if (!cloud.user) return "登录后跨设备同步";
  if (cloud.syncStatus === "syncing") return "正在合并学习记录";
  if (cloud.syncStatus === "pending") return "正在保存更改";
  if (cloud.syncStatus === "error") return "同步遇到问题";
  return "学习记录已同步";
}

export function AccountDialog({ cloud }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [working, setWorking] = useState(false);
  const [formError, setFormError] = useState("");
  const isBusy = ["loading", "syncing", "pending"].includes(cloud.syncStatus);

  useEffect(() => {
    if (cloud.user) setSent(false);
  }, [cloud.user]);

  async function submitEmail(event) {
    event.preventDefault();
    setWorking(true);
    setFormError("");
    try {
      await cloud.sendMagicLink(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(error.message || "登录邮件发送失败");
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    setWorking(true);
    setFormError("");
    try {
      await cloud.signOut();
      setOpen(false);
    } catch (error) {
      setFormError(error.message || "退出失败");
    } finally {
      setWorking(false);
    }
  }

  const StatusIcon = cloud.syncStatus === "error"
    ? CloudOff
    : cloud.user && cloud.syncStatus === "synced"
      ? CloudCheck
      : Cloud;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={`header-action-button account-trigger ${cloud.user ? "is-signed-in" : ""}`}
        type="button"
        aria-label={cloud.user ? statusCopy(cloud) : "登录并同步学习记录"}
      >
        <StatusIcon />
        {cloud.user && <i className={`cloud-status-dot status-${cloud.syncStatus}`} />}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="account-overlay" />
        <Dialog.Content className="account-dialog">
          <Dialog.Close className="account-close" aria-label="关闭账户窗口"><X /></Dialog.Close>
          <span className="account-eyebrow">CLOUD SYNC</span>
          <Dialog.Title>{cloud.user ? "学习记录已连接" : "同步你的学习进度"}</Dialog.Title>
          <Dialog.Description>
            {cloud.user
              ? "收藏、掌握状态和记忆曲线会先保存在本机，再安全同步到云端。"
              : "输入邮箱接收登录链接。首次登录会自动合并当前浏览器里的学习记录。"}
          </Dialog.Description>

          {cloud.user ? (
            <div className="account-signed-in">
              <div className={`account-sync-card status-${cloud.syncStatus}`}>
                {isBusy ? <LoaderCircle className="is-spinning" /> : <StatusIcon />}
                <span><strong>{statusCopy(cloud)}</strong><small>{cloud.user.email}</small></span>
                {cloud.syncStatus === "synced" && <Check />}
              </div>
              {(cloud.syncError || formError) && <p className="account-error">{cloud.syncError || formError}</p>}
              <div className="account-actions">
                <button type="button" onClick={cloud.syncNow} disabled={isBusy}><RefreshCcw />立即同步</button>
                <button type="button" onClick={handleSignOut} disabled={working}><LogOut />退出登录</button>
              </div>
              <p className="account-local-note">退出后，本机记录仍然保留；重新登录会继续同步。</p>
            </div>
          ) : sent ? (
            <div className="account-mail-sent">
              <i><Mail /></i>
              <strong>登录链接已经发出</strong>
              <p>请在邮件中点击链接。返回这里后，当前学习记录会自动上传。</p>
              <button type="button" onClick={() => setSent(false)}>换一个邮箱</button>
            </div>
          ) : (
            <form className="account-form" onSubmit={submitEmail}>
              <label htmlFor="account-email">邮箱地址</label>
              <div><Mail /><input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
              {(formError || cloud.syncError) && <p className="account-error">{formError || cloud.syncError}</p>}
              <button type="submit" disabled={working || !cloud.configured}>{working ? <LoaderCircle className="is-spinning" /> : <Cloud />}发送登录链接</button>
              <small>无需密码。登录链接会发送到这个邮箱。</small>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
