import { initializeApp, credential, app } from 'firebase-admin'

export default class Firebase {
    
    fbase: app.App
    
    constructor() {
        const config = this.getConfig()
        this.fbase = initializeApp({
            credential: credential.cert({
                projectId: config.project_id,
                clientEmail: config.client_email,
                privateKey: config.private_key,
            }),
            databaseURL: `https://${config.project_id}.firebaseio.com`
        })
    }

    private getConfig(){
        return JSON.parse(Buffer.from(process.env.FBASE_SERVICE!, 'base64').toString('ascii'))
    }
}