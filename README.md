# poi-plugin-kcps-terminal

[主页](http://kcps.info)

## 介绍

这是为 KancollePlayerSimulator Kai/Evol （以下简称KCPS）提供支持的poi浏览器插件。
它启动一个http服务器，客户端（KCPS）使用Get方法配合参数获取需要的数据。

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
  返回画面相对于游戏默认画面大小的比例。这会影响传输带宽、判断的准确性。实际上是根据画面截图缩放的，这里以默认画面大小为标准的好处是在随意改变窗口大小时返回的图片分辨率也是固定的（实际上KCPS不要求返回的画面大小固定）。
+ JPEG质量
  设置返回JPEG格式图片的质量。这会影响CPU占用、传输带宽、判断的准确性。

因为这些不属于与KCPS通信的接口的定义，因此不影响移植。

## 安装

这个插件还没有发布到npm上，不能自动安装、更新，因为有以下顾虑：

+ 插件还很简陋（主要）
+ 不想有闲得没事的“正义使者”再来找我麻烦（次要）

需要下载后自己手动复制到poi的插件目录。
poi的插件目录在`%appdata%/poi/plugins/node_modules`下，输入到资源管理器里按回车就有了。
不过还有个问题是依赖的问题。这个插件依赖了个npm包，在gitignore里被过滤掉了，所以还需要在本插件文件夹下命令行运行`npm install`下载依赖。
之后打开poi就可以看到这个插件。服务器的开关直接在poi的“扩展程序”设置里改就行了。
挺麻烦的，以后肯定还是要在npm上发布的。

## 开发

我在这之前几乎从没接触过Web开发，JS更是过去尝试去学了几次都失败了。
这么几行代码也要捣鼓几天才做出个基本的样子。
现在主要不满意的有：

+ 界面只能说是能用，说不上美观。
  那个口令输入框在没有口令时难以选中，需要点好多下。
+ 我还有点担心第一次写的JS会不会有什么我还不知道的坑。