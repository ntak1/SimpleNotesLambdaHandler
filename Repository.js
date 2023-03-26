import AWS from '/var/runtime/node_modules/aws-sdk/lib/aws.js';

const s3Client = new AWS.S3({ apiVersion: '2006-03-01' });

const SIMPLE_NOTES_BUCKET = "simplenotesbucket";


class RepositoryResponse {
    constructor(httpsStatus, body, message) {
        this.httpsStatus = httpsStatus;
        this.body = body == null || body == undefined ? "" : body;
        this.message = message;
    };

    setMessage = (message) => {
        this.message = message;
    };

    setHttpStatus = (httpsStatus) => {
        this.httpsStatus = httpsStatus;
    };

    setBody = (body) => {
        this.body = body;
    }
}

const defaultErrorHandler = (err, data) => {
    if (err) {
        console.log("There was an error: ", err)
        return new RepositoryResponse(err.statusCode, err.code, err.message);
    } else {
        console.log(data)
        return new RepositoryResponse(200, data.Body, null);
    }
}


export const getNoteFromRepository = async (userId, noteId) => {
  const notePath = `${userId}/${noteId}`;
  const params = {
    Bucket: SIMPLE_NOTES_BUCKET,
    Key: notePath,
  };
  
  try {
    const s3Response = await s3Client.getObject(params).promise();
    console.log(s3Response);
    return new RepositoryResponse(200, s3Response.Body, null);
  } catch (error) {
    console.error("Found error", error);
    return new RepositoryResponse(500, null, error);
  }
};


export const getUserNotesFromRepository = async (userId) => {
  const params = {
    Bucket: SIMPLE_NOTES_BUCKET,
    Delimiter: '/',
    Prefix: userId,
  };

  try {
    const s3Response = await s3Client.listObjects(params).promise();

    const contents = s3Response.Contents;
    const objects = await Promise.all(
      contents.map(async (content) => {
        const object = await s3Client
          .getObject({
            Bucket: SIMPLE_NOTES_BUCKET,
            Key: content.Key,
          })
          .promise();

        return object.Body.toString('utf-8');
      })
    );

    return new RepositoryResponse(200, objects, null);
  } catch (error) {
    console.error(error);
    return new RepositoryResponse(500, null, error);
  }
};



export const writeUserNoteInRepository = async(userId, noteId, noteContent) => {
    const notePath = `${userId}/${noteId}`
    const params = {
        Bucket: SIMPLE_NOTES_BUCKET,
        Key: notePath,
        Body: noteContent
    };

    const s3Response = s3Client.putObject(params, defaultErrorHandler);
    return new RepositoryResponse(200, s3Response.Body, null);
}
