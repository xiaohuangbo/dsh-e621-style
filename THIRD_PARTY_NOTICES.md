# 第三方来源与说明

本插件依据用户提供的本地 e621ng 源码，将默认 hexagon 主题的配色与界面习惯适配到 DSH；不是 e621 官方插件，也不附带图库、站点徽标或吉祥物。

参考位置（相对 e621ng 仓库根目录）：

- `app/javascript/src/styles/themes/_theme_hexagon.scss`：背景 `#020f23`、前景 `#152f56`、面板 `#1f3c67`、链接 `#b4c7d9`、金色 `#e8c446`。
- `app/javascript/src/styles/base/_base.scss`：Verdana / Geneva 字体栈。
- `app/javascript/src/styles/common/containers.scss`、`common/navigation.scss`、`common/forms.scss`：小圆角、平面蓝色面板与亮色输入框。
- `app/javascript/src/styles/views/static/_home.scss`：首页背景与可读性设计的参考。

六边形 SVG 纹理由本插件重新绘制；插件图标亦为原创。不复制 e621ng 的 PNG 背景、字体文件或角色插画。Verdana / Geneva 使用用户系统已有字体，不随插件分发。DSH 的 React 由运行环境提供，不重复捆绑。

e621ng 仓库根 LICENSE 的版权声明如下；保留于此以覆盖主题数值及适配参考：

```text
Copyright (c) 2013, Danbooru Project
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those
of the authors and should not be interpreted as representing official policies,
either expressed or implied, of the FreeBSD Project.
```
