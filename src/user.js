const { DynamoDB, SES } = require("aws-sdk")
const { v4 } = require("uuid")

module.exports.addUser = async (event) => {
    try {
        const { nombre, cedula } = JSON.parse(event.body)

        if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

        const database = new DynamoDB.DocumentClient()

        const Item = {
            nombre, cedula, id: v4()
        }

        await database.put({ TableName: "usuarios", Item }).promise();

        return {
            mensaje: "Usuario creado correctamente",
            usuario: Item
        }
    } catch (error) {
        return {
            error: error.message
        }
    }
}

module.exports.updateUser = async (event) => {

    try {
        const { nombre, cedula } = JSON.parse(event.body)
        const { id } = event.pathParameters

        const database = new DynamoDB.DocumentClient()

        if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

        const usuario = await database.update({
            TableName: "usuarios",
            Key: { id },
            UpdateExpression: "set nombre = :nombre, cedula = :cedula",
            ExpressionAttributeValues: {
                ":nombre": nombre,
                ":cedula": cedula
            },
            ReturnValues: "ALL_NEW"
        }).promise()

        return {
            mensaje: "El usuario ha sido actualizado",
            usuario
        }
    } catch (error) {
        return {
            error: error.message
        }
    }
}

module.exports.deleteUser = async (event) => {
    try {
        const { id } = event.pathParameters;
        const database = new DynamoDB.DocumentClient()

        const usuario = await database.delete({
            TableName: "usuarios",
            Key: { id },
            ReturnValues: "ALL_OLD"
        }).promise()

        return {
            mensaje: "El usuario ha sido eliminado",
            usuario
        }

    } catch (error) {
        return {
            error: error.message
        }
    }
}

module.exports.getUsers = async (event) => {
    const database = new DynamoDB.DocumentClient()
    const usuarios = await database.scan({ TableName: "usuarios" }).promise()

    return { usuarios }
}

