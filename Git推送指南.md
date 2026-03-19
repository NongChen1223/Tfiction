# Git 推送指南

## 当前状态

你本地有 2 个新的提交需要推送到 GitHub：

```
a4cf11e feat: 完善阅读器组件，添加章节导航、搜索功能、摸鱼模式界面
91828d6 fix: 修复章节解析逻辑，支持多种章节标题格式，添加阅读进度保存功能
```

## 推送方法

### 方法 1：使用 SSH（推荐）

如果你已经配置了 SSH 密钥：

```bash
cd ~/Desktop/PersonDevelop/go_read/moyureader

# 设置远程 URL 为 SSH
git remote set-url origin git@github.com:NongChen1223/moyureader.git

# 推送
git push origin main
```

### 方法 2：使用 HTTPS（需要 GitHub 账号）

```bash
cd ~/Desktop/PersonDevelop/go_read/moyureader

# 设置远程 URL 为 HTTPS
git remote set-url origin https://github.com/NongChen1223/moyureader.git

# 推送（会提示输入用户名和密码）
git push origin main
```

**注意：** GitHub 现在使用 Personal Access Token 代替密码。

### 方法 3：使用 GitHub CLI（如果已安装）

```bash
cd ~/Desktop/PersonDevelop/go_read/moyureader

# 登录
gh auth login

# 推送
git push origin main
```

### 方法 4：使用 Git 凭据助手（macOS）

```bash
# 配置 Git 使用 osxkeychain 凭据助手
git config --global credential.helper osxkeychain

# 第一次推送时会保存凭据
git push origin main
```

## 如果推送失败

### 1. 检查网络连接
```bash
ping github.com
```

### 2. 检查远程仓库
```bash
git remote -v
```

### 3. 检查分支
```bash
git branch -vv
```

### 4. 查看详细错误信息
```bash
GIT_CURL_VERBOSE=1 git push origin main
```

## 推送成功后

推送成功后，你应该能在 GitHub 上看到这两个提交：

https://github.com/NongChen1223/moyureader/commits/main

## 需要帮助？

如果以上方法都失败，请提供以下信息：

1. 你使用的推送方法（SSH/HTTPS）
2. 完整的错误信息
3. `git remote -v` 的输出
4. `git branch -vv` 的输出
