'use strict'; 

const path = require('path');
const fs = require('fs');
const child = require('child_process');
const Conf = require('conf');
const inquirer = require('inquirer');
const env = require('yeoman-environment').createEnv();
const chalk = require('chalk');
const figures = require('figures');
const get = require('lodash.get');
const minimist = require('minimist');
const updateNotifier = require('update-notifier');
const fuzzyRun = require('fuzz-run');
const pkg = require('../package.json');

const addonKey = 'ngx-generator-addon';
const disabledAddons = 'disabledAddons';
const blacklistedNpmAddons = ['ngx-generator', 'ngx-generator-addon'];
const appName = 'ngx-generator';
const logo = require('./logo');
const help = `${chalk.bold(`Usar:`)} ${appName} ${chalk.green(`[new|update|script]`)} [opções]\n`;
const detailedHelp = `
${chalk.blue('n, new')} [name]
    Cria um novo aplicativo.

${chalk.blue('u, update')}
    Atualiza um aplicativo ou complemento existente.

${chalk.blue('script')}
    Executa o script especificado a partir do seu ${chalk.bold(`package.json`)}.
    Funciona como ${chalk.bold(`npm run <script>`)}.

    ${chalk.green(`npm run start`)}: Inicie um servidor dev em http://localhost:4200
    ${chalk.green(`npm run build`)}: Criar um aplicativo para produção
    ${chalk.green(`npm run e2e`)}: Inicie testes automatizados
    ${chalk.green(`npm run ssl`)}: Inicie um servidor dev com SSL em https://localhost:4200
    ${chalk.green(`npm run server`)}: Inicie uma API Mock com json-server
    ${chalk.green(`npm run translations:extract`)}: Inicie para extrair strings
    ${chalk.green(`npm run install-vsts-npm-auth`)}: Inicie para instalar o pacote de autenticação com o VSTS
    ${chalk.green(`npm run vsts-npm-auth`)}: Inicie para autenticar com o usuario VSTS
`;


class NgxCli {
    constructor(args) {
        this._args = args;

        this._options = minimist(args, {
            boolean: ['help', 'npm', 'addon', 'packageManager'],
            alias: {
              n: 'npm',
              a: 'addon'
            }
        });

        this._config = new Conf({
            defaults: {
              disabledAddons: {}
            }
        });

        env.register(require.resolve('..'), 'ngx-generator');
    }

    run() {
        updateNotifier({pkg}).notify();

        if (this._options.help) {
            this._help(true);
        }

        switch (this._args[0]) {
            case 'n':
            case 'new':
                return this.generate(false, this._args.slice(1), this._options.addon);
            case 'u':
            case 'update':
                return this.generate(true, this._args.slice(1), this._options.addon);
            case 'c':
            case 'config':
                return this.configure();
            case 'l':
            case 'list':
                return this.list(this._options.npm);
            default:
                this.runScript(this._args);
        }
    }

    runScript(args) {
        if (!args[0]) {
            return this._help();
        }

        const packageManager = this._packageManager();

        fuzzyRun(args, packageManager);
    }

    async generate(update, args, addon) {
        if (!update) {
            console.log(logo(pkg.version));
        } else if (fs.existsSync('.yo-rc.json')) {
            const rc = JSON.parse(fs.readFileSync('.yo-rc.json'));
            addon = Boolean(get(rc, 'ngx-generator.props.isAddon'));
        } else {
            this._exit(`Nenhum aplicativo existente encontrado, use ${chalk.blue('ngx-generator new')}`);
        }

        if (addon) {
            args = args.filter(arg => arg !== '--addon' && arg !== '-a');

            env.lookup(() =>
                env.run(['ngx-generator:addon'].concat(args), {
                update,
                packageManager: this._packageManager(),
                'skip-welcome': true
                })
            );
        } else {
            const disabled = this._config.get(disabledAddons);
            let addons = await this._findAddons();

            addons = addons.filter(addon => !disabled[addon]);

            await new Promise(resolve =>
                env.lookup(() =>
                    env.run(
                        ['ngx-generator'].concat(args), {
                            update,
                            packageManager: this._packageManager(),
                            addons: addons.join(' '),
                            'skip-welcome': true
                        },
                        resolve
                    )
                )
            );
        }
    }

    async configure() {
        const addons = await this._findAddons();
        const disabled = this._config.get(disabledAddons);
        const answers = await inquirer.prompt({
            type: 'checkbox',
            name: 'addons',
            message: 'Escolha complementos para usar em novos aplicativos',
            choices: addons.map(addon => ({
                name: addon,
                checked: !disabled[addon]
            }))
        });

        this._config.set(
            disabledAddons,
            addons.filter(addon => !answers.addons.includes(addon)).reduce((r, addon) => {
              r[addon] = true;
              return r;
            }, {})
        );

        console.log('Configuração salva.');
    }

    async list(npm) {
        let addons;

        if (npm) {
            addons = await Promise.resolve(child.execSync(`npm search ${addonKey} --json`, {stdio: [0, null, 2]}));
            addons = addons ? JSON.parse(addons) : [];
            addons = addons.filter(addon => blacklistedNpmAddons.indexOf(addon.name) === -1);
        } else {
            addons = await this._findAddons();
        }

        const disabled = this._config.get(disabledAddons);
        
        console.log(chalk.blue(`Complementos disponíveis${npm ? ' em NPM' : ''}:`));

        if (addons.length === 0) {
            console.log('Nenhum complemento encontrado.');
        } else if (npm) {
            addons.forEach(addon => console.log(`  ${addon.name}@${addon.version} - ${addon.description}`));
        } else {
            addons.forEach(addon => console.log(`${chalk.green(disabled[addon] ? ' ' : figures.tick)} ${addon}`));
        }
    }

    _findAddons() {
        return new Promise(resolve => {
            env.lookup(() => {
                const generators = env.getGeneratorsMeta();
                const addons = Object.keys(generators)
                    .map(alias => generators[alias])
                    .filter(generator => {
                        const packagePath = this._findPackageJson(generator.resolved);
                        const keywords = require(packagePath).keywords || [];
                        return keywords.includes(addonKey);
                    })
                    .map(generator => generator.namespace.replace(/(.*?):app$/, '$1'));
                
                resolve(addons);
            });
        });
    }

    _findPackageJson(basePath) {
        const find = components => {
            if (components.length === 0) {
                return null;
            }

            const dir = path.join(...components);
            const packageFile = path.join(dir, 'package.json');

            return fs.existsSync(packageFile) ? packageFile : find(components.slice(0, -1));
        };
    
        const components = basePath.split(/[/\\]/);

        if (components.length !== 0 && components[0].length === 0) {
            // Quando o caminho começa com uma barra, o primeiro componente do caminho é uma cadeia vazia
            components[0] = path.sep;
        }

        return find(components);
    }

    _packageManager() {
        let pm = null;

        if (this._options.packageManager) {
            return this._options.packageManager === 'yarn' ? 'yarn' : 'npm';
        }

        try {
            const rc = require(path.join(process.cwd(), '.yo-rc.json'));
            pm = rc['ngx-generator'].props.packageManager;
        } catch (error) {
            // Fazer nada
        }

        return pm || process.env.NGX_PACKAGE_MANAGER || 'npm';
    }

    _help(details) {
        console.log(logo(pkg.version));
        this._exit(help + (details ? detailedHelp : `Usar ${chalk.white(`--help`)} para mais informações.\n`));
    }

    _exit(error, code = 1) {
        console.error(error);
        process.exit(code);
    }
}

module.exports = NgxCli;