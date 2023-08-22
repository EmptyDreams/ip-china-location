## 欢迎使用

该模块用于获取中国区域的省级定位信息（不保证准确），不支持国外定位。

第一次查找所需时间 10ms 左右，非首次查找所需时间 < 1ms。

## 快速开始

使用 `findIPv4` 即可查找指定 IP 的定位，使用 `findOnVercel` 可通过 Vercel 的请求头获取定位信息。

目前 Vercel 平台不支持自动加载数据库，调用 `findOnVercel` 和 `loadDatabase` 时需要手动传入路径。