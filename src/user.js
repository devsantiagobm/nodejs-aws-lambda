module.exports.addUser = async (event) => {
    try {
        const { nombre, cedula } = JSON.parse(event.body)

        if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

        return {
            mensaje: "Usuario creado correctamente",
            usuario: { nombre, cedula }
        }
    } catch (error) {
        return {
            error: error.message
        }
    }
}

module.exports.updateUser = async (event) => {
    const { nombre, cedula } = JSON.parse(event.body)

    if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

    return {
        mensaje: "El usuario ha sido actualizado",
        usuario: { nombre, cedula }
    }
}

module.exports.deleteUser = async (event) => {
    const { id } = JSON.parse(event.body)

    if (!id) return { error: "El id del usuario es obligatorio" }

    return {
        mensaje: "El usuario ha sido eliminado",
        usuario: {
            id
        }
    }
}

module.exports.getUsers = async (event) => {

    return {
        users: [
            {
                id: "id1",
                nombre: "nombre1",
                cedula: "cedula1"
            },
            {
                id: "id2",
                nombre: "nombre2",
                cedula: "cedula2"
            },
            {
                id: "id3",
                nombre: "nombre3",
                cedula: "cedula3"
            },
        ]
    }
}