const { DynamoDB, SES, SNS, SSM, CognitoIdentityServiceProvider } = require("aws-sdk")
const { v4 } = require("uuid")

module.exports.addUser = async (event) => {
    try {
        const { nombre, cedula } = JSON.parse(event.body)

        if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

        const database = new DynamoDB.DocumentClient()
        const ssm = new SSM()
        const TableName = (await ssm.getParameter({ Name: "dynamodb-table-name" }).promise()).Parameter.Value;


        const Item = { nombre, cedula, id: v4() }
        await database.put({ TableName, Item }).promise();

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


        if (!nombre || !cedula) return { error: "Los campos nombre y cedula son obligatorios" }

        const database = new DynamoDB.DocumentClient()

        const ssm = new SSM()
        const TableName = (await ssm.getParameter({ Name: "dynamodb-table-name" }).promise()).Parameter.Value;

        const usuario = await database.update({
            TableName,
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

        const ssm = new SSM()
        const TableName = (await ssm.getParameter({ Name: "dynamodb-table-name" }).promise()).Parameter.Value;

        const usuario = await database.delete({
            TableName,
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

    const ssm = new SSM()
    const TableName = (await ssm.getParameter({ Name: "dynamodb-table-name" }).promise()).Parameter.Value;
    const usuarios = await database.scan({ TableName }).promise()

    return { usuarios }
}

module.exports.sns = async (event) => {


    try {
        const { address } = JSON.parse(event.Records[0].Sns.Message);

        if (!address) return { error: "El campo address es obligatorio" }

        const ses = new SES();

        let emailParams = {
            Destination: {
                // This application uses the sandbox version of SES, so it can only send emails to addresses verified in SES
                ToAddresses: ["sanseb290514@gmail.com", /*address*/]
            },
            Message: {
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <head>
                                    <style>
                                        body {
                                            font-family: 'Arial', sans-serif;
                                            background-color: #f4f4f4;
                                            margin: 0;
                                            padding: 20px;
                                        }
                                        .container {
                                            max-width: 600px;
                                            margin: 0 auto;
                                            background-color: #fff;
                                            padding: 20px 32px;
                                            border-radius: 5px;
                                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                        }
                                        h1 {
                                            color: #333;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>Correo usando SES y SNS</h1>
                                        <p>Hola ${address}</p>
                                    </div>
                                </body>
                            </html>
                        `,
                        Charset: "UTF-8"
                    }
                },
                Subject: {
                    Data: "AWS SES",
                    Charset: "UTF-8"
                }
            },
            Source: "sanseb290514@gmail.com"
        };

        await ses.sendEmail(emailParams).promise()
        return {
            mensaje: "Correo enviado"
        }

    } catch (error) {

        console.log(error);
        console.log(error.message);

        return {
            mensaje: error.message
        }

    }

}

module.exports.email = async (event) => {
    try {
        const { address } = JSON.parse(event.body)
        if (!address) return { error: "El campo address es obligatorio" }
        const ssm = new SSM();

        const TargetArn = (await ssm.getParameter({ Name: "arn-sns-email" }).promise()).Parameter.Value;
        const params = { TargetArn, Message: JSON.stringify({ address }) };

        const sns = new SNS()
        await sns.publish(params).promise()
        return { mensaje: "Correo enviado" };

    } catch (error) {
        return { mensaje: error.message }
    }
}



module.exports.signup = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) return { error: "Los campos email y password son obligatorios" }

        const UserPoolId = "us-west-2_Hfi179ACd";
        const userPoolClient = "client-name";

        const cognito = new CognitoIdentityServiceProvider();
        const result = await cognito.adminCreateUser({
            UserPoolId,
            Username: email,
            UserAttributes: [
                {
                    Name: "email",
                    Value: email
                },
                {
                    Name: "email_verified",
                    Value: "true"
                },
            ],
            MessageAction: "SUPPRESS"
        }).promise()

        if (!result.User) throw new Error("Ups! Parece que el usuario no pudo ser creado");

        await cognito.adminSetUserPassword({
            Password: password,
            UserPoolId,
            Username: email,
            Permanent: true
        }).promise()

        return { mensaje: "Usuario creado correctamente" }
    } catch (error) {
        console.log(error);
        console.log(error.message);

        return {
            error: error.message
        }
    }
}

module.exports.login = async (event) => {
    try {
        const { email, password } = JSON.parse(event.body);

        if (!email || !password) return { error: "Los campos email y password son obligatorios" }

        const UserPoolId = "us-west-2_Hfi179ACd";
        const userPoolClient = "725aeg3c16l72b22gptobnff3q";

        const cognito = new CognitoIdentityServiceProvider();
        const response = await cognito.adminInitiateAuth({
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            UserPoolId,
            ClientId: userPoolClient,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        }).promise()

        return { mensaje: "Inicio de sesión correcto", /*token: response.AuthenticationResult.AccessToken,*/ response }
    } catch (error) {
        console.log(error);
        console.log(error.message);

        return {
            error: error.message
        }
    }
}