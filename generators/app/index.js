'use strict';

const chalk = require('chalk');
const Insight = require('insight');
const semver = require('semver');
const Generator = require('@ngx-rocket/core');
const asciiLogo = require('@ngx-rocket/ascii-logo');

const pkg = require('../../package.json');
const prompts = require('./prompts');
const options = require('./options');

class NgxGenerator extends Generator {
    initializing() {
        this.version = pkg.version;
        this.insight = new Insight({trackingCode: 'UA-93069862-1', pkg});
        this.props = {};

        if (semver.lt(process.version, '8.9.0')) {
            this.log(chalk.yellow('O Angular CLI v6 precisa do NodeJS v8.9 ou superior.'));
            this.log(chalk.yellow(`Você está usando ${process.version} que não é suportado, por favor atualize.\n`));

            process.exit(-1);
        }

        this.argument('appName', {
            description: 'Nome do aplicativo para gerar',
            type: String,
            required: false
        });

        this.insight.optOut = !this.options.analytics || process.env.DISABLE_NGX_ANALYTICS;

        if (this.options.raw) {
            this.props.ui = 'raw';
        }

        if (this.options['location-strategy']) {
            this.props.location = this.options['location-strategy'];
        }

        // Updating
        let fromVersion = null;

        if (this.options.update) {
            this.props = this.config.get('props') || this.props;
            fromVersion = this.config.get('version');
        }

        if (fromVersion) {
            if (fromVersion >= this.version) {
              this.log(chalk.green("\nNada para atualizar, tudo é bom!\n"));
              // eslint-disable-next-line unicorn/no-process-exit
              process.exit(0);
            }
      
            this.updating = true;
            this.log(
              `\nAtualizando ${chalk.green(this.props.appName)} projeto (${chalk.yellow(fromVersion)} -> ${chalk.yellow(
                this.version
              )})\n`
            );
            this.log(`${chalk.yellow("Certifique-se de não ter alterações não confirmadas antes de substituir arquivos!")}`);
            this.insight.track('update', fromVersion, 'to', this.version);
        } else if (!this.options['skip-welcome']) {
            // this.log(asciiLogo(pkg.version));
        }

        // Composition
        const addonsOption = this.options.addons;
        this.addons = addonsOption ? addonsOption.split(' ') : [];
        this.addons.forEach(addon => this.composeWith(addon, this.options));

        this.insight.track('version', this.version);
        this.insight.track('node', process.version);
        this.insight.track('platform', process.platform);
        this.insight.track('addons', addonsOption);
    }

    async prompting() {
        await super.prompting();
        this.props.mobile = this.props.mobile || [];
        this.shareProps(this.props);
    }

    configuring() {
        this.insight.track(
            'generator',
            this.props.target,
            this.props.ui,
            this.props.auth ? 'auth' : 'no-auth'
        );
        this.insight.track('package-manager', this.packageManager);
    }

    install() {
        if (this.options.git) {
            this.spawnCommandSync('git', ['init', '--quiet']);
        }

        if (!this.options['skip-install']) {
            this.log(`\Rodando ${chalk.yellow(`${this.packageManager} install`)}, por favor, espere...`);

            if (this.packageManager === 'yarn') {
                this.yarnInstall();
            } else {
                this.npmInstall(null, {loglevel: 'error'});
            }
        }
    }

    end() {
        if (this.updating) {
            this.log(`\nAtualizada ${chalk.green(this.props.appName)} para ${chalk.yellow(this.version)} com sucesso!`);
            return;
        }

        this.log('\nTudo feito! Comece com estas tarefas:');
        this.log(
            `- $ ${chalk.green(`${this.packageManager} start`)}: Inicie um servidor dev em http://localhost:4200`
        );

        this.log(`- $ ${chalk.green(`${this.packageManager} run build`)}: Criar um aplicativo para produção`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run e2e`)}: Inicie testes automatizados`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run server`)}: Inicie uma API Mock com json-server`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run ssl`)}: Inicie um servidor dev com SSL em https://localhost:4200`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run translations:extract`)}: Inicie para extrair strings`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run install-vsts-npm-auth`)}: Inicie para instalar o pacote de autenticação com o VSTS`);
        this.log(`- $ ${chalk.green(`${this.packageManager} run vsts-npm-auth`)}: Inicie para autenticar com o usuario VSTS`);
    }
}

module.exports = Generator.make({
    baseDir: __dirname,
    generator: NgxGenerator,
    options,
    prompts
});