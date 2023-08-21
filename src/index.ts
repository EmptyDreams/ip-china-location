import fs from 'fs'

let database: IpLocationData[]

/** 查询指定 IP 的地址（仅支持国内） */
export function find(ip: string): string {
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
    // noinspection DuplicatedCode
    const buffer = fs.readFileSync('D:/Desktop/region.bin')
    const length = buffer.readUInt32LE()
    const array = new Array(length)
    for (let i = 0; i != length; ++i) {
        const pos = 10 * i + 4
        array[i] = {
            start: buffer.readUInt32LE(pos),
            end: buffer.readUInt32LE(pos + 4),
            loc: iso2strMap[buffer.readUInt16LE(pos + 8)]
        }
    }
    database = array
}

const iso2strMap: {[propName: number]: string} = {
    19014: '福建', 17479: '广东', 17736: '河北', 19010: '北京', 19530: '吉林',
    20044: '辽宁', 19790: '内蒙古', 19272: '香港', 22356: '台湾', 20035: '中国',
    23111: '贵州', 22606: '宁夏', 21322: '江苏', 18497: '安徽', 17491: '山东',
    19528: '黑龙江', 22611: '山西', 20051: '陕西', 18515: '上海', 22599: '广西',
    16712: '河南', 20301: '澳门', 19034: '浙江', 17235: '四川', 20803: '重庆',
    20057: '云南', 20040: '湖南', 22602: '江西', 19028: '天津', 16968: '湖北',
    23128: '西藏', 21319: '甘肃', 18760: '海南', 19032: '新疆', 18513: '青海'
}

interface IpLocationData {
    loc: string,
    start: number,
    end: number
}