# blackbox-cli

> Blackbox command line interface.

The Blackbox command line interface (CLI) provides support for managing a Blackbox project. Project configuration is stored in the `blackbox.json` file and the OpenAPI definitions are stored in the `openapi.json` file. The CLI can be used to manage datatypes and services required by your project and to generate server code.

A Blackbox project is a project that provides a REST API conforming to the Blacbkox specification. The Blackbox specification provides standards for developing a REST API based on service and datatype definitions. The services and datatypes are defined within an OpenAPI document.

For further information about the Blackbox Specification refer to the Blackbox website.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Examples](#examples)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Install

```
npm i -g blackbox-cli
```

or run without global install:

```
npx blackbox-cli <command>
```

## Usage

```
bb command [type] [options]
```

### Commands

 |Command|Description
 |---|---
 |`init`      | Initialise a Blackbox API project with an OpenAPI document.
 |`add`       | Add a new item; must provide a type.
 |`update`    | Update an existing item; must provide a type.
 |`list`      | Shows a list of items; must provide a type.
 |`delete`    | Delete an itesm; must provide a type.
 |`generate`  | Generate server code from the OpenAPI document.
 

### Types

 |Type|Description
 |---|---
 |`service`     | A Blackbox API service.
 |`datatype`    | A datatype used by a service.
 |`repository`  | A datatype repository.
 |`server`      | A Blackbox server.
 |`extension`   | An extension to the blackbox CLI.

### Options

 |Option|Description
 |---|---
 |`-V, --version`                 | Output the version number
 |`-n, --name <name>`             | The name of the entity being added or modified.
 |`-t, --title <title>`           | The title of the API.
 |`--desc <description>`          | The description of the API or service.
 |`-p, --path <path>`             | The path to the parent node in the case of sub-services (use # as value placeholders, defaults to the root node). The package name when adding an extension.
 |`--access <access>`              | The access type for the service. One of 'unique', 'id' or 'index'.
 |`-i, --identifier <identifier>`  | The identifier field for the service. E.g. 'id' or 'name'. Required if access is 'id' or 'index'.
 |`-d, --datatype <datatype>`      | The data type of a service.
 |`-m, --methods <methods>`        | A comma separated list of HTTP methods to be supported by the service.
 |`-a, --all`                      | Apply operation to all relevant items. E.g. bb delete service -a -n s1 will remove service s1 and any child services.
 |`-f, --file <file>`              | A source file to read in data appropriate to the command and type.
 |`-u, --url <url>`                | A source url to read in data appropriate to the command and type.
 |`--dest <dest>`                  | Destination path for generated files.
 |`--summary <summary>`            | Summary for a service.
 |`-v, --verbose`                  | Display verbose output.
 |`--meta <metadata>`              | Static metadata for a service in JSON format.

## Examples

### Initialise the blackbox project
Give the project a name, and specify the title and description for the Open API document:
```
bb init --name iot \
    --title "IoT Test Service" \
    --desc "IoT example with unique, index, id services and sub-service."
```

### Add a datatype repository
Repositories hold a set of named datatype specifications. 
Adding a repository adds it to your `blackbox.json` configuration file and makes it available to use for services.

Add a local repository:
```
bb add repository --file path/to/repo/datatypes.json
```

Add a remote repository (the repository will be added to your blackbox.json):
```
bb add repository --url http://example.com/repositories/maths.json
```

### Add a datatype

Datatypes can be added from a repository, a local file or constructed manually.
In each case the datatype will be added to your `openapi.json` as a schema.

Add a datatype from a repository that has already been loaded with `bb add repository` - the type `location` must exist within one of the loaded repositories:
```
add datatype --name typeNamedInRepo
```

Add a datatype manually - if the named datatype is note found in a repository you will be given prompts to specify the datatype's parameters:
```
bb add datatype --name newType
```

Add a datatype from a local file:
```
bb add datatype --name temperature --file types.json
```

### Add a service
Add a service to the root of the server's path:
```
bb add service \
    --name location \
    --summary "Locations" \
    --desc "IoT supported buildings and locatoins." \
    --access id \
    --identifier name \
    --datatype location \
    --methods get,post,put,patch,delete
```

Add a sub-service:
```
bb add service \
    --name device \
    --path /location/# \
    --access index
```

Assign the datatype for a service (the datatype must be primitive, already added to the openapi.json, or exist in a repository):
```
bb update service \
    --path /location/#/device \
    --datatype iot-device \
    --method post,delete
```

### Generate code
Generate a server:
```
bb generate server
```

Generate datatypes:
```
bb generate datatype
```

Generate services:
```
bb generate services
```

## Maintainers

[@ellipsistechnology](https://github.com/ellipsistechnology)

## Contributing

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2019 Ben Millar
