export default class HttpError extends Error {
    status: number

    constructor(status: number, message: string, path?: string) {
        super(message)
        this.status = status
    }
}


////////////////////////////
// 400 Error Classes
///////////////////////////

export class BadRequest extends HttpError
{
    description: string
    constructor(message: string) {
        super(400, message)
        this.description = 'The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, size too large, invalid request message framing, or deceptive request routing).'
    }
}

export class Unauthorized extends HttpError
{
    description: string
    constructor(message: string) {
        super(401, message)
        this.description = 'Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided. The response must include a WWW-Authenticate header field containing a challenge applicable to the requested resource. See Basic access authentication and Digest access authentication. 401 semantically means "unauthenticated", the user does not have valid authentication credentials for the target resource. '
    }
}

export class PaymentRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(402, message)
        this.description = 'Reserved for future use. The original intention was that this code might be used as part of some form of digital cash or micropayment scheme, as proposed, for example, by GNU Taler, but that has not yet happened, and this code is not widely used. Google Developers API uses this status if a particular developer has exceeded the daily limit on requests. Sipgate uses this code if an account does not have sufficient funds to start a call. Shopify uses this code when the store has not paid their fees and is temporarily disabled. Stripe uses this code for failed payments where parameters were correct, for example blocked fraudulent payments.'
    }
}

export class Forbidden extends HttpError
{
    description: string
    constructor(message: string) {
        super(403, message)
        this.description = 'The request contained valid data and was understood by the server, but the server is refusing action. This may be due to the user not having the necessary permissions for a resource or needing an account of some sort, or attempting a prohibited action (e.g. creating a duplicate record where only one is allowed). This code is also typically used if the request provided authentication by answering the WWW-Authenticate header field challenge, but the server did not accept that authentication. The request should not be repeated.'
    }
}

export class NotFound extends HttpError
{
    description: string
    constructor(message: string) {
        super(404, message)
        this.description = 'The requested resource could not be found but may be available in the future. Subsequent requests by the client are permissible.'
    }
}

export class MethodNotAllowed extends HttpError
{
    description: string
    constructor(message: string) {
        super(405, message)
        this.description = 'A request method is not supported for the requested resource; for example, a GET request on a form that requires data to be presented via POST, or a PUT request on a read-only resource.'
    }
}

export class NotAcceptable extends HttpError
{
    description: string
    constructor(message: string) {
        super(406, message)
        this.description = 'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request. See Content negotiation.'
    }
}

export class ProxyAuthenticationRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(407, message)
        this.description = 'The client must first authenticate itself with the proxy.'
    }
}

export class RequestTimeout extends HttpError
{
    description: string
    constructor(message: string) {
        super(408, message)
        this.description = 'The server timed out waiting for the request. According to HTTP specifications: "The client did not produce a request within the time that the server was prepared to wait. The client MAY repeat the request without modifications at any later time."'
    }
}

export class Conflict extends HttpError
{
    description: string
    constructor(message: string) {
        super(409, message)
        this.description = 'Indicates that the request could not be processed because of conflict in the current state of the resource, such as an edit conflict between multiple simultaneous updates.'
    }
}

export class Gone extends HttpError
{
    description: string
    constructor(message: string) {
        super(410, message)
        this.description = 'Indicates that the resource requested was previously in use but is no longer available and will not be available again. This should be used when a resource has been intentionally removed and the resource should be purged. Upon receiving a 410 status code, the client should not request the resource in the future. Clients such as search engines should remove the resource from their indices. Most use cases do not require clients and search engines to purge the resource, and a "404 Not Found" may be used instead. '
    }
}

export class LengthRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(411, message)
        this.description = 'The request did not specify the length of its content, which is required by the requested resource.'
    }
}

export class PreconditionFailed extends HttpError
{
    description: string
    constructor(message: string) {
        super(412, message)
        this.description = 'The server does not meet one of the preconditions that the requester put on the request header fields.'
    }
}

export class PayloadTooLarge extends HttpError
{
    description: string
    constructor(message: string) {
        super(413, message)
        this.description = 'The request is larger than the server is willing or able to process. Previously called "Request Entity Too Large".: §10.4.14 '
    }
}

export class URITooLong extends HttpError
{
    description: string
    constructor(message: string) {
        super(414, message)
        this.description = 'The URI provided was too long for the server to process. Often the result of too much data being encoded as a query-string of a GET request, in which case it should be converted to a POST request. Called "Request-URI Too Long" previously.'
    }
}

export class UnsupportedMediaType extends HttpError
{
    description: string
    constructor(message: string) {
        super(415, message)
        this.description = 'The request entity has a media type which the server or resource does not support. For example, the client uploads an image as image/svg'
    }
}

export class RangeNotSatisfiable extends HttpError
{
    description: string
    constructor(message: string) {
        super(416, message)
        this.description = 'The client has asked for a portion of the file (byte serving), but the server cannot supply that portion. For example, if the client asked for a part of the file that lies beyond the end of the file. Called "Requested Range Not Satisfiable" previously.'
    }
}

export class ExpectationFailed extends HttpError
{
    description: string
    constructor(message: string) {
        super(417, message)
        this.description = 'The server cannot meet the requirements of the Expect request-header field.'
    }
}

export class ImATeapot extends HttpError
{
    description: string
    constructor(message: string) {
        super(418, message)
        this.description = 'This code was defined in 1998 as one of the traditional IETF April Fools\' jokes, in RFC 2324, Hyper Text Coffee Pot Control Protocol, and is not expected to be implemented by actual HTTP servers. The RFC specifies this code should be returned by teapots requested to brew coffee. This HTTP status is used as an Easter egg in some websites, such as Google.com\'s "I\'m a teapot" easter egg. Sometimes, this status code is also used as a response to a blocked request, instead of the more appropriate 403 Forbidden. '
    }
}

export class MisdirectedRequest extends HttpError
{
    description: string
    constructor(message: string) {
        super(421, message)
        this.description = 'The request was directed at a server that is not able to produce a response (for example because of connection reuse).'
    }
}

export class UnprocessableContent extends HttpError
{
    description: string
    constructor(message: string) {
        super(422, message)
        this.description = 'The request was well-formed (i.e., syntactically correct) but could not be processed.'
    }
}

export class Locked extends HttpError
{
    description: string
    constructor(message: string) {
        super(423, message)
        this.description = 'The resource that is being accessed is locked.[7]'
    }
}

export class FailedDependency extends HttpError
{
    description: string
    constructor(message: string) {
        super(424, message)
        this.description = 'The request failed because it depended on another request and that request failed (e.g., a PROPPATCH).'
    }
}

export class TooEarly extends HttpError
{
    description: string
    constructor(message: string) {
        super(425, message)
        this.description = 'Indicates that the server is unwilling to risk processing a request that might be replayed.'
    }
}

export class UpgradeRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(426, message)
        this.description = 'The client should switch to a different protocol such as TLS/1.3, given in the Upgrade header field.'
    }
}

export class PreconditionRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(428, message)
        this.description = 'The origin server requires the request to be conditional. Intended to prevent the \'lost update\' problem, where a client GETs a resource\'s state, modifies it, and PUTs it back to the server, when meanwhile a third party has modified the state on the server, leading to a conflict.'
    }
}

export class TooManyRequests extends HttpError
{
    description: string
    constructor(message: string) {
        super(429, message)
        this.description = 'The user has sent too many requests in a given amount of time. Intended for use with rate-limiting schemes.'
    }
}

export class RequestHeaderFieldsTooLarge extends HttpError
{
    description: string
    constructor(message: string) {
        super(431, message)
        this.description = 'The server is unwilling to process the request because either an individual header field, or all the header fields collectively, are too large.'
    }
}

export class UnavailableForLegalReasons extends HttpError
{
    description: string
    constructor(message: string) {
        super(451, message)
        this.description = 'A server operator has received a legal demand to deny access to a resource or to a set of resources that includes the requested resource. The code 451 was chosen as a reference to the novel Fahrenheit 451.'
    }
}


////////////////////////////
// 500 Error Classes
///////////////////////////

export class InternalServerError extends HttpError
{
    description: string
    constructor(message: string) {
        super(500, message)
        this.description = 'A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.'
    }
}

export class NotImplemented extends HttpError
{
    description: string
    constructor(message: string) {
        super(501, message)
        this.description = 'The server either does not recognize the request method, or it lacks the ability to fulfil the request. Usually this implies future availability (e.g., a new feature of a web-service API).'
    }
}

export class BadGateway extends HttpError
{
    description: string
    constructor(message: string) {
        super(502, message)
        this.description = 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.'
    }
}

export class ServiceUnavailable extends HttpError
{
    description: string
    constructor(message: string) {
        super(503, message)
        this.description = 'The server is currently unavailable (because it is overloaded or down for maintenance). Generally, this is a temporary state.'
    }
}

export class GatewayTimeout extends HttpError
{
    description: string
    constructor(message: string) {
        super(504, message)
        this.description = 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.'
    }
}

export class HTTPVersionNotSupported extends HttpError
{
    description: string
    constructor(message: string) {
        super(505, message)
        this.description = 'The server does not support the HTTP protocol version used in the request.'
    }
}

export class VariantAlsoNegotiates extends HttpError
{
    description: string
    constructor(message: string) {
        super(506, message)
        this.description = 'The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself, and is therefore not a proper end point in the negotiation process.'
    }
}

export class InsufficientStorage extends HttpError
{
    description: string
    constructor(message: string) {
        super(507, message)
        this.description = 'The server is unable to store the representation needed to complete the request. This condition is considered temporary.'
    }
}

export class LoopDetected extends HttpError
{
    description: string
    constructor(message: string) {
        super(508, message)
        this.description = 'The server detected an infinite loop while processing the request (sent in lieu of 208 Already Reported).'
    }
}

export class NotExtended extends HttpError
{
    description: string
    constructor(message: string) {
        super(510, message)
        this.description = 'Further extensions to the request are required for the server to fulfil it.'
    }
}

export class NetworkAuthenticationRequired extends HttpError
{
    description: string
    constructor(message: string) {
        super(511, message)
        this.description = 'The client needs to authenticate to gain network access. Intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used to require agreement to Terms of Service before granting full Internet access via a Wi-Fi hotspot).'
    }
}
