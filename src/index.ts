import fs from 'fs'
import {VercelRequest} from '@vercel/node'
import * as path from 'path'

let database: IpLocationData[]

/** 查询指定 IP 的地址（仅支持国内） */
export function findIPv4(ip: string, databasePath?: string): string | undefined {
    if (!database) loadDatabase(databasePath)
    const dist = ipv4ToLong(ip)
    let left = 0, right = database.length - 1
    do {
        const mid = (left + right) >>> 1
        const item = database[mid]
        if (item.end < dist) left = mid + 1
        else if (item.start > dist) right = mid - 1
        else return item.loc
    } while (left <= right)
    return undefined
}

// noinspection JSUnusedGlobalSymbols
/** 在 Vercel 上查找 IP 的地址（仅支持国内，优先使用 Vercel 定位） */
export function findOnVercel(request: VercelRequest, databasePath: string): string | undefined {
    const headers = request.headers
    const country = headers['x-vercel-ip-country'] as string
    if (country != 'CN')
        return vercelMap[country]
    const prov = headers['x-vercel-ip-country-region']
    if (prov) return iso2strMap[prov as string]
    const value = request.headers['x-real-ip']
    if (!value) return '中国'
    const ip = typeof value === 'string' ? value : value[0]
    if (ip.includes(':')) return '中国'
    return findIPv4(ip, databasePath)
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
export function loadDatabase(databasePath?: string) {
    if (database) return
    const provList = [
        '中国', '江西', '辽宁', '安徽', '北京', '福建', '甘肃', '广东', '广西', '贵州', '海南',
        '河南', '河北', '黑龙江', '湖北', '湖南', '吉林','江苏', '内蒙古', '宁夏', '青海', '山东',
        '山西', '陕西', '上海', '四川', '天津', '西藏', '新疆', '云南', '浙江', '重庆', '澳门',
        '香港', '台湾'
    ]
    if (!databasePath) {
        const rootPath = __dirname.substring(0, __dirname.length - 5)
        databasePath = path.resolve(rootPath, 'resources/region.bin')
    }
    const buffer = fs.readFileSync(databasePath)
    const length = buffer.readUInt16LE()
    const array = new Array<IpLocationData>(length)
    for (let i = 0; i != length; ++i) {
        const pos = 6 * i + 2
        const start = buffer.readUInt32LE(pos)
        const mask = buffer.readUint8(pos + 4)
        const loc = buffer.readUint8(pos + 5)
        const end = start | ((1 << mask) - 1)
        array[i] = {
            start, end: end >>> 0, loc: provList[loc]
        }
    }
    database = array
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

const vercelMap: {[propName: string]: string} = {
    HK: '香港', TW: '台湾'
}

interface IpLocationData {
    loc: string,
    start: number,
    end: number
}