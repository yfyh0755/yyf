// PWA 功能脚本
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installPrompt = document.getElementById('install-prompt');
    this.installBtn = document.getElementById('install-btn');
    this.dismissBtn = document.getElementById('dismiss-btn');
    
    this.init();
  }

  init() {
    // 注册 service worker
    this.registerServiceWorker();
    
    // 监听安装事件
    this.listenForInstallPrompt();
    
    // 绑定按钮事件
    this.bindEvents();
    
    // 检查是否已安装
    this.checkIfInstalled();
  }

  // 注册 Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('SW registered: ', registration);
        
        // 监听更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.log('SW registration failed: ', error);
      }
    }
  }

  // 监听安装提示事件
  listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认的安装提示
      e.preventDefault();
      
      // 保存事件以便稍后触发
      this.deferredPrompt = e;
      
      // 显示自定义安装提示
      this.showInstallPrompt();
    });
  }

  // 显示安装提示
  showInstallPrompt() {
    if (this.installPrompt && !this.isInstalled()) {
      this.installPrompt.classList.remove('hidden');
      
      // 5秒后自动隐藏
      setTimeout(() => {
        this.hideInstallPrompt();
      }, 5000);
    }
  }

  // 隐藏安装提示
  hideInstallPrompt() {
    if (this.installPrompt) {
      this.installPrompt.classList.add('hidden');
    }
  }

  // 绑定按钮事件
  bindEvents() {
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => {
        this.installApp();
      });
    }

    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => {
        this.hideInstallPrompt();
      });
    }
  }

  // 安装应用
  async installApp() {
    if (this.deferredPrompt) {
      // 显示安装提示
      this.deferredPrompt.prompt();
      
      // 等待用户响应
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('用户接受了安装提示');
        this.hideInstallPrompt();
        
        // 显示成功消息
        this.showToast('安装成功！学霸方块已添加到主屏幕', 'good');
      } else {
        console.log('用户拒绝了安装提示');
      }
      
      // 清除保存的提示
      this.deferredPrompt = null;
    }
  }

  // 检查是否已安装
  checkIfInstalled() {
    // 检查是否以独立模式运行
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      console.log('应用已安装');
      this.hideInstallPrompt();
    }
  }

  // 检查是否已安装（辅助方法）
  isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // 显示更新通知
  showUpdateNotification() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.showToast('学霸方块已更新到最新版本！', 'good');
        // 刷新页面以加载新版本
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    }
  }

  // 显示提示消息
  showToast(message, type = 'good') {
    // 使用现有的 toast 系统
    if (window.toast) {
      window.toast(message, type);
    } else {
      // 备用提示方法
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        right: 12px;
        bottom: 12px;
        background: #111827;
        border: 1px solid rgba(255,255,255,.08);
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 6px 20px rgba(0,0,0,.3);
        z-index: 1000;
        color: #e5e7eb;
        font-size: 14px;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);
    }
  }
}

// 初始化 PWA 功能
document.addEventListener('DOMContentLoaded', () => {
  new PWAInstaller();
});

// 添加离线检测
window.addEventListener('online', () => {
  console.log('网络已连接');
});

window.addEventListener('offline', () => {
  console.log('网络已断开');
  // 可以显示离线提示
  if (window.toast) {
    window.toast('网络已断开，游戏将以离线模式运行', 'warn');
  }
});

// 导出 toast 函数供其他脚本使用
window.toast = function(message, type = 'good') {
  // 这里可以调用现有的 toast 系统
  console.log(`Toast: ${message} (${type})`);
};
