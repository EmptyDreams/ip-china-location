import fs from 'fs'
import {VercelRequest} from '@vercel/node'
import * as path from 'path'

let database: IpLocationData[]

/** 查询指定 IP 的地址（仅支持国内） */
export function findIPv4(ip: string): string {
    if (!database) loadDatabase()
    const dist = ipv4ToLong(ip)
    let left = 0, right = database.length - 1
    do {
        const mid = (left + right) >>> 1
        const item = database[mid]
        if (item.end < dist) left = mid + 1
        else if (item.start > dist) right = mid - 1
        else return item.loc
    } while (left <= right)
    return 'unknown'
}

/** 在 Vercel 上查找 IP 的地址（仅支持国内，优先使用 Vercel 定位） */
export function findOnVercel(request: VercelRequest): string {
    const headers = request.headers
    const country = headers['x-vercel-ip-country'] as string
    if (country != 'CN')
        return country == 'TW' ? '台湾' : country
    const prov = headers['x-vercel-ip-country-region']
    if (prov) return iso2strMap[prov as string]
    const value = request.headers['x-real-ip']
    if (!value) return 'unknown'
    const ip = typeof value === 'string' ? value : value[0]
    if (ip.includes(':')) return 'unknown'
    return findIPv4(ip)
}

/** 将字符串形式的 IPv4 地址转换为整数 */
export function ipv4ToLong(ip: string): number {
    let result = 0
    ip.split('.')
        .map(it => Number.parseInt(it))
        .forEach(it => result = (result << 8) | it)
    return result >>> 0
}

/** 加载数据库 */
export function loadDatabase() {
    const rootPath = __dirname.substring(0, __dirname.length - 5)
    const buffer = fs.readFileSync(path.resolve(rootPath, 'resources/region.bin'))
    const length = buffer.readUInt32LE()
    const array = new Array(length)
    for (let i = 0; i != length; ++i) {
        const pos = 10 * i + 4
        array[i] = {
            start: buffer.readUInt32LE(pos),
            end: buffer.readUInt32LE(pos + 4),
            loc: num2strMap[buffer.readUInt16LE(pos + 8)]
        }
    }
    database = array
}

const num2strMap: {[propName: number]: string} = {
    19014: '福建', 17479: '广东', 17736: '河北', 19010: '北京', 19530: '吉林',
    20044: '辽宁', 19790: '内蒙古', 19272: '香港', 22356: '台湾', 20035: '中国',
    23111: '贵州', 22606: '宁夏', 21322: '江苏', 18497: '安徽', 17491: '山东',
    19528: '黑龙江', 22611: '山西', 20051: '陕西', 18515: '上海', 22599: '广西',
    16712: '河南', 20301: '澳门', 19034: '浙江', 17235: '四川', 20803: '重庆',
    20057: '云南', 20040: '湖南', 22602: '江西', 19028: '天津', 16968: '湖北',
    23128: '西藏', 21319: '甘肃', 18760: '海南', 19032: '新疆', 18513: '青海'
}

const iso2strMap: {[propName: string]: string} = {
    JX: '江西', LN: '辽宁', AH: '安徽', BJ: '北京', FJ: '福建',
    GS: '甘肃', GD: '广东', GX: '广西', GZ: '贵州', HI: '海南',
    HA: '河南', HL: '黑龙江', HB: '湖北', HN: '湖南', JL: '吉林',
    JS: '江苏', NM: '内蒙古', NX: '宁夏', QH: '青海', SD: '山东',
    SX: '山西', SN: '陕西', SH: '上海', SC: '四川', TJ: '天津',
    XZ: '西藏', XJ: '新疆', YN: '云南', ZJ: '浙江', CQ: '重庆',
    MO: '澳门', HK: '香港', TW: '台湾', HE: '河北'
}

interface IpLocationData {
    loc: string,
    start: number,
    end: number
}