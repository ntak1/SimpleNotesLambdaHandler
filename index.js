import {getNoteFromRepository, getUserNotesFromRepository, writeUserNoteInRepository} from "repository.js"

const repositoryResponseConverter = (repositoryResponse) => {
    return {
        statusCode: repositoryResponse.httpStatus,
        body: repositoryResponse.body.toString()
    };
};

const DEFAULT_RESPONSE = {
    statusCode: 500,
    body: "Server Error"
};


// GET: user/<userId>/notes
// List the notes for a given user
// Parameters:
//  - userId: String
const handleGetNotes = async(userId) => {
    console.log(`handleGetNotes for userId [${userId}]`);
    
    let response = DEFAULT_RESPONSE;

    await getUserNotesFromRepository(userId)
        .then((data) => {
            response = repositoryResponseConverter(data);
            console.log(response);
            return response;
        })
        .catch((err) => {
            console.log(err);
        });

    return repositoryResponseConverter(response);
}


// GET: user/<userId>/notes/<noteId>
// Return the notes from the user given the userId and noteId
// Parameters:
//  - userId: String
//  - nodeId: String
const handleGetNote = async(userId, noteId) => {
    console.log(`handleGetNote for userId=[${userId}] and nodeId=[${noteId}]`);
    
    let response = DEFAULT_RESPONSE;
    await getNoteFromRepository(userId, noteId)
        .then((data) => {
            response = repositoryResponseConverter(data);
            console.log(response);    
            return response;

        })
        .catch((err) => console.log(err));

    return response;
};


// POST: user/<userId>/notes/<noteId>
// Updates a note, given userId, noteId and notesContent
const handleUpdateNote = async(userId, noteId, notesContent) => {
    console.log(`handleUpdateNote for userId=[${userId}] and noteId=[${noteId}] and content=[${notesContent}]`);

    let response = DEFAULT_RESPONSE;

    response = await writeUserNoteInRepository(userId, noteId, notesContent).then(
        (data) => {
            response = repositoryResponseConverter(data);
            console.log(response);
            return response;
        }
    );

    return response;
};


const parsePath = (pathUrl) => {
    let modifiedPathUrl = pathUrl;
    if (modifiedPathUrl.endsWith("/")) {
      modifiedPathUrl = modifiedPathUrl.slice(0, -1);
    }
    if (modifiedPathUrl.startsWith("/")) {
      modifiedPathUrl = modifiedPathUrl.slice(1);
    }
    return modifiedPathUrl;
  };
  

const isUserAuthenticated = (event) => {
    const userIdentity = event.requestContext.identity.user;
    const tokens = parsePath(event.path);
    
    console.log("debug", userIdentity, tokens);
    if (tokens.length === 0) {
        return false;
    }
    
    if (tokens[0] === "users") {
        const claimedUserIdentity = tokens[1];
        if (userIdentity !== claimedUserIdentity) {
            console.log(`Unauthenticated user [${userIdentity}] claims to be [${claimedUserIdentity}]`);
            return false;
        }
        return true;
    }
    return false;
}


export const handler = async (event) => {
    
    console.log("Starting to process event: ", JSON.stringify(event, null, 2));
    
    // Authenticate user
    if (!isUserAuthenticated(event)) {
        return {
            statusCode: 400,
            body: "Invalid method invocation exception. Unauthenticated user.",
        }
    }
    
    const { httpMethod, path, body } = event;
    const normalizedHttpMethod = httpMethod.toLowerCase();
    const tokens = parsePath(path);

    if (normalizedHttpMethod === "get") {
        // GET: user/<userId>/notes
        if (tokens.length === 3 && tokens[0] === "users" && tokens[2] == "notes") {
            const userId = tokens[1];
            return await handleGetNotes(userId);
        }
        // GET: user/<userId>/notes/<noteId>
        if (tokens.length === 4 && tokens[0] === "users" && tokens[2] == "notes") {
            const userId = tokens[1];
            const noteId = tokens[3];
            return await handleGetNote(userId, noteId);
        }
    } else if (normalizedHttpMethod === "post") {
        // GET: user/<userId>/notes/<noteId>
        if (tokens.length === 4 && tokens[0] === "users" && tokens[2] == "notes") {
            const userId = tokens[1];
            const noteId = tokens[3];
            return await handleUpdateNote(userId, noteId, body);
        }
    }

    // Default response
    return {
        statusCode: 400,
        body: "Invalid method invocation exception",
    };
};
