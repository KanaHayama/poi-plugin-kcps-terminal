# poi-plugin-kcps-terminal

[主页](http://kcps.info)

## 介绍

这是为 KancollePlayerSimulator Kai/Evol （以下简称KCPS）提供支持的poi浏览器插件。

安装方法见下方**安装**一节。

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
  
  http服务器监听端口，用于与脚本本体通信。
  
+ 口令
  
  简易的认证机制。原理简单，便于移植。明文通信，虽不能防止中间人窃听，但可以给非要在公网计算机上运行插件的人一种保护机制。
  
+ 缩放
  
  返回画面相对于游戏默认画面大小(1200×720)的比例。传输前会按这个比例将截图缩放，因此影响画面质量的首先是浏览器自身的画面大小。这会影响传输带宽、判断的准确性。这里以默认画面大小为标准的好处是在随意改变窗口大小时返回的图片分辨率也是固定的（实际上KCPS不要求返回的画面大小固定）。
  
+ JPEG质量
  
  设置返回JPEG格式图片的质量。这会影响CPU占用、传输带宽、判断的准确性。

因为这些不属于与KCPS通信的接口的定义，因此不影响移植。

## 已知问题

+ poi不可以最小化
  
  最小化后游戏画面会停止渲染，无法正常获取图像。最小化不可以，但被其他应用遮挡是可以的。
  
+ poi分离模式下截图服务器会卡住
  
  这个是玄学问题，我没有JS开发经验，解决不了，据说可能是remote导致的。
  
+ 系统显示设置开启HDR后无法截图
  
  开启HDR后，截图会变得一片黑。脚本就不能用了。不知道是哪里的问题。
  
+ 界面简陋
  
  那个口令输入框在没有口令时难以选中，需要点好多下。

## 安装

在poi浏览器“扩展程序”设置中输入本插件包名`poi-plugin-kcps-terminal`点“安装”就可以了。

安装（以及禁用后再启用插件）后必须**刷新游戏**，以让插件获得游戏api数据。

安装后使用任意网页浏览器访问[localhost:5277/capture](http://localhost:5277/capture)，这时可以看到游戏的截图，说明插件运行正常。

### poi 10.7.0 及以上版本的额外操作

*从poi 10.6开始每个新版本都会多出一些奇怪的毛病，就比如说这个。*

请按以下步骤修改用于启动poi浏览器的快捷方式（不建议修改开始菜单中的那个快捷方式；原因是，poi不知道为什么，每次启动都要重写开始菜单的快捷方式，所以你如果改了那个快捷方式就是白改了；比如可以在桌面上新建一个快捷方式再改）：
+ 打开poi快捷方式所在文件夹。
+ 打开poi快捷方式的“属性”窗口（右键单击，选择“属性”）。
+ 修改`目标(T):`，在原有内容的末尾添加内容` --disable-site-isolation-trials --disable-features=CalculateNativeWinOcclusion`（比如，将`“C:\Program Files\poi\poi.exe”`改为`"C:\Program Files\poi\poi.exe" --disable-site-isolation-trials --disable-features=CalculateNativeWinOcclusion`，注意`"`和`--`之间有空格）。
+ 点击“确定”保存修改。
+ 在此之后请始终使用此快捷方式启动poi。

不进行此修改会导致KCPS无法执行鼠标动作而后报错多次点击失败（10.7之前版本的poi默认自带这个修改，所以该问题仅在10.7版开始出现）。

## 开发

我在这之前几乎从没接触过Web开发，JavaScript更是过去尝试去学了几次都失败了。

这么几行代码也要捣鼓几天才做出个基本的样子。

Github其实我也不是很会用。

要干的事还不少……

欢迎有兴趣的朋友在此基础上继续开发。

*因发现同行抄袭还不公开源代码，许可变更为GPL，以从道义上避免后续再出现该类状况*

## 更新记录

1.4.7
+ 尝试定位有些用户用10.6版以上poi时获取数据时报错传入undefined的问题。

1.4.5 & 1.4.6
+ 适配poi 10.7.0

1.4.3 & 1.4.4
+ 修复不能正确记录基地航空队任务变更的Bug

1.4.2
+ 移除了WinAPI功能

1.4.1
+ 适配electron 8.3.0

1.4.0
+ 适配poi10.5中新版electron的新截图API，同时兼容旧版poi
+ 支持新旧最多两种winapi鼠标操作本机代码库

1.3.2
+ 适配electron 6.1.5

1.3.0~1.3.1
+ 增加联合舰队类型api

1.2.3
+ 修复了“基于Windows操作系统API的鼠标模拟机制”模式下系统缩放非100%时无法正确点击的Bug。

