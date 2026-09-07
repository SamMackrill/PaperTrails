# Vendored dependencies

`js-yaml.min.js` is js-yaml 4.3.2, distributed under the MIT licence.

Release commit: https://github.com/nodeca/js-yaml/commit/79ca68d90f333fbe6d9e42827527e62636200191
Package artifact: https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz
SHA-256 (`vendor/js-yaml.min.js`): `32391560601990BB6E0DAABD8106A35A6A539DE088532413931A70A4CB4F4769`

## Runtime boundary

`src/dataLoader.js` calls `jsyaml.load` only for the four repository-owned YAML files under `data/`, fetched from the same origin. These files are treated as trusted, immutable deployment assets, not user-supplied input. Keep that boundary; user-controlled or remote YAML requires additional limits and isolation before it is passed to this loader.
