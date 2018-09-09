# poi-plugin-kcps-terminal

[主页](http://kcps.info)

## 介绍

这是为 KancollePlayerSimulator Kai/Evol （以下简称KCPS）提供支持的poi浏览器插件。

它启动一个http服务器，客户端（KCPS）使用Get方法配合参数获取需要的数据。

（这个仓库只与该插件相关，讨论KCPS的内容请至[KCPS的仓库](http://github.com/KanaHayama/KanCollePlayerSimulator)）

提供支持的接口包括：

+ 鼠标动作
+ 截取画面
+ 刷新页面
+ 获取数据

考虑到KCPS的目标不只是在poi浏览器上使用，因此保持较少的通用接口且（尽量）不特定于浏览器的返回内容是有必要的。

可供修改的选项：

+ 端口
  
  http服务器监听端口。
  
+ 口令
  
  简易的认证机制。原理简单，便于移植。明文通信，虽不能防止中间人窃听，但可以给非要在公网计算机上运行插件的人一种保护机制。
  
+ 缩放
  
  返回画面相对于游戏默认画面大小(1200×720)的比例。传输前会按这个比例将截图缩放，因此影响画面质量的首先是浏览器自身的画面大小。这会影响传输带宽、判断的准确性。这里以默认画面大小为标准的好处是在随意改变窗口大小时返回的图片分辨率也是固定的（实际上KCPS不要求返回的画面大小固定）。
  
+ JPEG质量
  
  设置返回JPEG格式图片的质量。这会影响CPU占用、传输带宽、判断的准确性。

因为这些不属于与KCPS通信的接口的定义，因此不影响移植。

## 已知问题

+ 鼠标操作时poi会获得焦点

  浏览器如何响应鼠标事件不是KCPS能影响的，所以解决不了。
  
+ poi分离模式下截图服务器会卡住

  这个是玄学问题，我没有JS开发经验，解决不了，据说可能是remote导致的。
  
+ 系统显示设置开启HDR后无法截图

  开启HDR后再启动poi，截图会变得一片黑。脚本就不能用了。不知道是哪里的问题。
  
+ 界面简陋
  
  那个口令输入框在没有口令时难以选中，需要点好多下。
  
## 安装

在poi“扩展程序”设置中输入包名**poi-plugin-kcps-terminal**就可以下载了。

第一次安装（以及禁用后再启用插件）建议刷新游戏，以让插件获得数据。

安装后在浏览器输入[localhost:5277/capture](http://localhost:5277/capture)，这时可以看到游戏的截图。

## 开发

我在这之前几乎从没接触过Web开发，JavaScript更是过去尝试去学了几次都失败了。

这么几行代码也要捣鼓几天才做出个基本的样子。

Github其实我也不是很会用。

要干的事还不少……

欢迎有兴趣的朋友在此基础上继续开发。
