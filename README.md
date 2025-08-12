# 🎓 学霸俄罗斯方块：期末不挂科版

一款融合校园梗和俄罗斯方块的趣味游戏，通过整理知识点方块来挑战高分！

## ✨ 游戏特色

- **经典玩法**：传统俄罗斯方块的核心机制
- **校园主题**：方块内容为各种学科知识点
- **道具系统**：肥宅快乐水、学霸笔记、偷看答案等有趣道具
- **突发事件**：校园广播、同桌捣乱等随机事件
- **幽默文案**：监考老师、班主任等NPC互动
- **PWA支持**：可安装到主屏幕，支持离线运行

## 🚀 PWA 功能

### 安装到主屏幕
- 支持Android和iOS设备
- 独立窗口运行，无浏览器地址栏
- 自动显示安装提示

### 离线支持
- Service Worker缓存游戏资源
- 网络断开时仍可正常游戏
- 自动更新检测

### 推送通知
- 游戏更新提醒
- 可选的游戏邀请通知

## 📱 使用方法

### 1. 生成图标
首先需要生成PWA所需的图标：

```bash
# 打开图标生成器
open generate-icons.html

# 生成并下载所有尺寸的图标
# 将图标保存到 icons/ 文件夹
```

### 2. 部署应用
将整个项目文件夹部署到支持HTTPS的Web服务器：

```bash
# 使用Python简单服务器（开发测试）
python -m http.server 8000

# 或使用Node.js
npx serve .

# 或部署到GitHub Pages、Netlify等平台
```

### 3. 安装PWA
1. 在支持PWA的浏览器中打开应用
2. 等待安装提示出现
3. 点击"安装"按钮
4. 应用将添加到主屏幕

## 🎮 游戏操作

### 键盘控制
- `← →` 左右移动方块
- `↑` 旋转方块
- `↓` 加速下落
- `空格` 硬降到底部
- `P` 暂停/继续
- `1/2/3` 使用道具

### 触屏控制
- 左右按钮：移动方块
- 旋转按钮：旋转方块
- 硬降按钮：快速下落

## 🛠️ 技术架构

### 前端技术
- **HTML5 Canvas**：游戏渲染
- **CSS3**：响应式UI设计
- **JavaScript ES6+**：游戏逻辑
- **Service Worker**：离线缓存
- **Web App Manifest**：PWA配置

### 文件结构
```
yyf/
├── index.html          # 主页面
├── styles.css          # 样式文件
├── game.js            # 游戏逻辑
├── pwa.js             # PWA功能
├── sw.js              # Service Worker
├── manifest.json      # PWA配置
├── generate-icons.html # 图标生成器
├── icons/             # 图标文件夹
└── README.md          # 说明文档
```

## 🔧 自定义配置

### 修改游戏参数
在 `game.js` 中调整：

```javascript
const initialEnergy = 100;      // 初始精力值
const initialTime = 120;        // 考试时间（秒）
const FULL_MARKS_LINES = 20;    // 全科满分目标行数
```

### 修改PWA配置
在 `manifest.json` 中调整：

```json
{
  "name": "你的游戏名称",
  "short_name": "简称",
  "theme_color": "#你的主题色",
  "background_color": "#你的背景色"
}
```

## 🌐 浏览器兼容性

### 完全支持
- Chrome 67+
- Edge 79+
- Firefox 67+
- Safari 11.1+

### 部分支持
- iOS Safari 11.3+
- Samsung Internet 7.2+

## 📋 部署检查清单

- [ ] 生成所有尺寸的图标
- [ ] 将图标放入 `icons/` 文件夹
- [ ] 确保所有文件路径正确
- [ ] 部署到HTTPS服务器
- [ ] 测试PWA安装功能
- [ ] 测试离线运行
- [ ] 验证Service Worker注册

## 🐛 常见问题

### Q: 为什么没有显示安装提示？
A: 确保网站运行在HTTPS环境下，并且用户之前没有拒绝过安装提示。

### Q: 图标显示不正确？
A: 检查 `manifest.json` 中的图标路径是否与实际文件路径一致。

### Q: 离线功能不工作？
A: 确保Service Worker正确注册，检查浏览器控制台是否有错误信息。

## 📄 许可证

本项目仅供学习和娱乐使用。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进游戏！

---

**祝你在期末考试中取得好成绩！** 🎓✨
