# Mustache helpers in data sources

## Overview

Mustache expression evaluation is supported in various fields within data sources & data source bindings. More details on Mustache (template system) can be found [here](https://en.wikipedia.org/wiki/Mustache_(template_system))

Mustache expressions can include mustache handlers that provide specific functionality. The following are currently supported mustache handlers that can be used within data sources & data source bindings:

### Supported mustache helpers :
Default helpers:
| Mustache handler | Description |
| :------------- |:-------------|
| > | {{> foo context }} helper looks for a partial template registered as 'foo' and evaluates it against 'context'. Evaluates against the current context if 'context' is not given. |
| with | {{#with ...}} block helper sets context for the child expressions |
| if | {{#if ...}} block helper evaluates child expressions ONLY if the selected value is true |
| else | {{#else ...}} block helper evaluates child expressions ONLY if the selected value is false |
| unless | {{#unless ...}} block helper evaluates child expressions ONLY if the selected value is false  |
| each | {{#each ...}} block helper evaluates child expressions once for every item in an array or object |
| lookup | {{#lookup ../foo @index}} block helper allows for indexing into an object by @index or @key |

Common helpers:
| Mustache handler | Description |
| :------------- |:-------------|
| equals | {{#equals arg1 arg2 [true or false] ... }} block helper does string comparison and returns "true" or "false" based on whether the args match or not. Takes "true" or "false" as optional parameter indicating if comparison is case sensitive or not (default value is "false"). |
| notEquals | {{#notEquals arg1 arg2 [true or false] ... }} block helper does string comparison and returns "false" or "true" based on whether the args match or not. Takes "true" or "false" as optional parameter indicating if comparison is case sensitive or not (default value is "false"). |
| contains |  |
| stringLeft |  |
| stringRight |  |
| arrayLength |  |
| date |  |
| stringFormat |  |
| stringPadLeft |  |
| stringPadRight |  |
| stringReplace |  |
| and |  |
| or |  |

Additional helpers:
| Mustache handler | Description |
| :------------- |:-------------|
| #jsonEscape | Escape characters within JSON string |
| #regex | Evaluate regular expression. The evaluation cannot exceed 1 second |
| #stringReplace |  |
| #subString |  |
| #extractResource |  |
| selectMaxOfLong |  |
| splitAndIterate |  |
| recursiveFormat |  |
| addField |  |
| recursiveSelect |  |
| splitAndPrefix |  |
| extractNumbersAndSort |  |
| joinPaths |  |
| removePrefixFromPath |  |
| copyFieldFromParent |  |
| selectTokens |  |
| sortBy |  |
| add |  |
| isEqualNumber |  |

