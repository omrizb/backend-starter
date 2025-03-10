import fs from 'fs'
import fr from 'follow-redirects'

const { http, https } = fr

export const utilService = {
    readJsonFile,
    writeJsonFile,
    download,
    httpGet,
    makeId,
    deepMergeObjectsSourceKeysOnly,
    getRandomIntInclusive,
    getRandomItems,
    generateRandomName,
    generateRandomImg,
    timeAgo,
    randomPastTime
}


function readJsonFile(path) {
    const str = fs.readFileSync(path, 'utf8')
    const json = JSON.parse(str)
    return json
}

function writeJsonFile(path, data) {
    return new Promise((resolve, reject) => {
        const jsonData = JSON.stringify(data, null, 2)

        fs.writeFile(path, jsonData, (err) => {
            if (err) return reject(err)
            resolve()
        })
    })
}

function download(url, fileName) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(fileName)
        https.get(url, (content) => {
            content.pipe(file)
            file.on('error', reject)
            file.on('finish', () => {
                file.close()
                resolve()
            })
        })
    })
}

function httpGet(url) {
    const protocol = url.startsWith('https') ? https : http
    const options = {
        method: 'GET'
    }

    return new Promise((resolve, reject) => {
        const req = protocol.request(url, options, (res) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                resolve(data)
            })
        })
        req.on('error', (err) => {
            reject(err)
        })
        req.end()
    })

}

function makeId(length = 6) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

function deepMergeObjectsSourceKeysOnly(source, target) {
    const merged = { ...source }

    for (const key in source) {
        if (target.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                merged[key] = deepMergeObjectsSourceKeysOnly(source[key], target[key])
            } else {
                merged[key] = convertType(source[key], target[key])
            }
        }
    }

    return merged
}

function convertType(sourceValue, targetValue) {
    const sourceType = typeof sourceValue
    switch (sourceType) {
        case 'number':
            return Number(targetValue)
        case 'boolean':
            return Boolean(targetValue)
        case 'string':
            return String(targetValue)
        default:
            return targetValue
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min //The maximum is inclusive and the minimum is inclusive 
}

function getRandomItems(items, size = undefined, duplicationAllowed = false) {
    if (size && size > items.length && !duplicationAllowed) return

    const res = []
    const srcArray = (duplicationAllowed) ? items : [...items]
    const iterations = size || 1
    for (let i = 0; i < iterations; i++) {
        if (!duplicationAllowed && srcArray.length === 0) break
        const randIdx = Math.floor(Math.random() * srcArray.length)
        res.push(srcArray[randIdx])
        if (!duplicationAllowed) srcArray.splice(randIdx, 1)
    }

    return (size === undefined) ? res[0] : res
}

function generateRandomName() {
    const names = ['John', 'Wick', 'Strong', 'Dude', 'Yep', 'Hello', 'World', 'Power', 'Goku', 'Super', 'Hi', 'You', 'Are', 'Awesome']
    const famName = ['star', 'kamikaza', 'family', 'eat', 'some', 'banana', 'brock', 'david', 'gun', 'walk', 'talk', 'car', 'wing', 'yang', 'snow', 'fire']
    return names[Math.floor(Math.random() * names.length)] + famName[Math.floor(Math.random() * names.length)]
}

function generateRandomImg() {
    //try to get diff img every time
    return 'pro' + Math.floor(Math.random() * 17 + 1) + '.png'
}

function timeAgo(ms = new Date()) {
    const date = ms instanceof Date ? ms : new Date(ms)
    const formatter = new Intl.RelativeTimeFormat('en')
    const ranges = {
        years: 3600 * 24 * 365,
        months: 3600 * 24 * 30,
        weeks: 3600 * 24 * 7,
        days: 3600 * 24,
        hours: 3600,
        minutes: 60,
        seconds: 1,
    }
    const secondsElapsed = (date.getTime() - Date.now()) / 1000
    for (let key in ranges) {
        if (ranges[key] < Math.abs(secondsElapsed)) {
            const delta = secondsElapsed / ranges[key]
            let time = formatter.format(Math.round(delta), key)
            if (time.includes('in')) {
                time = time.replace('in ', '')
                time = time.replace('ago', '')
                time += ' ago'
            }
            return time //? time : 'Just now'
        }
    }
}

function randomPastTime() {
    const HOUR = 1000 * 60 * 60
    const DAY = 1000 * 60 * 60 * 24
    const WEEK = 1000 * 60 * 60 * 24 * 7

    const pastTime = getRandomIntInclusive(HOUR, WEEK)
    return Date.now() - pastTime
}
