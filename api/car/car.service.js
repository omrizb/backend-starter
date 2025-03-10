import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'


const PAGE_SIZE = 3
const CAR_COLLECTION = 'car'

export const carService = {
    remove,
    query,
    getById,
    add,
    update,
    addCarMsg,
    removeCarMsg,
}

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

        const collection = await dbService.getCollection(CAR_COLLECTION)
        var carCursor = await collection.find(criteria, { sort })

        if (filterBy.pageIdx !== undefined) {
            carCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        }

        const cars = carCursor.toArray()
        return cars
    } catch (err) {
        logger.error('cannot find cars', err)
        throw err
    }
}

async function getById(carId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(carId) }

        const collection = await dbService.getCollection(CAR_COLLECTION)
        const car = await collection.findOne(criteria)
        car.createdAt = car._id.getTimestamp()
        return car
    } catch (err) {
        logger.error(`while finding car ${carId}`, err)
        throw err
    }
}

async function remove(carId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: loggedinUserId, isAdmin } = loggedinUser

    try {
        const criteria = {
            _id: ObjectId.createFromHexString(carId),
        }

        if (!isAdmin) criteria['owner._id'] = loggedinUserId

        const collection = await dbService.getCollection(CAR_COLLECTION)
        const res = await collection.deleteOne(criteria)

        if (res.deletedCount === 0) throw ('Not your car')
        return carId
    } catch (err) {
        logger.error(`cannot remove car ${carId}`, err)
        throw err
    }
}

async function add(car) {
    try {
        const collection = await dbService.getCollection(CAR_COLLECTION)
        await collection.insertOne(car)

        return car
    } catch (err) {
        logger.error('cannot insert car', err)
        throw err
    }
}

async function update(car) {
    const carToSave = { vendor: car.vendor, speed: car.speed }

    try {
        const criteria = { _id: ObjectId.createFromHexString(car._id) }

        const collection = await dbService.getCollection(CAR_COLLECTION)
        await collection.updateOne(criteria, { $set: carToSave })

        return car
    } catch (err) {
        logger.error(`cannot update car ${car._id}`, err)
        throw err
    }
}

async function addCarMsg(carId, msg) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(carId) }
        msg.id = utilService.makeId()

        const collection = await dbService.getCollection(CAR_COLLECTION)
        await collection.updateOne(criteria, { $push: { msgs: msg } })

        return msg
    } catch (err) {
        logger.error(`cannot add car msg ${carId}`, err)
        throw err
    }
}

async function removeCarMsg(carId, msgId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(carId) }

        const collection = await dbService.getCollection(CAR_COLLECTION)
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`cannot add car msg ${carId}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {
        vendor: { $regex: filterBy.txt, $options: 'i' },
        speed: { $gte: filterBy.minSpeed },
    }

    return criteria
}

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}

// {$or: [{vendor :{$regex:'b', $options:"i"}}, {'owner.fullname' :{$regex:'b', $options:"i"}}]}