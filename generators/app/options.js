'use strict';

module.exports = [
    {
        name: 'skip-welcome',
        type: 'Boolean',
        required: false,
        description: "Ignorar a mensagem de boas-vindas de Yeoman",
        defaults: false
    },
    {
        name: 'analytics',
        type: 'Boolean',
        required: false,
        description: 'Relatar análises analíticas de uso anônimas',
        defaults: true
    },
    {
        name: 'addons',
        type: 'String',
        required: false,
        description: 'Use addons separados por espaço especificados',
        defaults: ''
    },
    {
        name: 'external-chrome',
        type: 'Boolean',
        required: false,
        description: 'Evite fazer o download de um binário extra do Google Chrome',
        defaults: false
    },
    {
        name: 'raw',
        type: 'Boolean',
        required: false,
        description: 'Não use nenhuma biblioteca de interface do usuário',
        defaults: false
    },
    {
        name: 'location-strategy',
        type: value => {
            if (value !== 'hash' && value !== 'path') {
                console.error('Estratégia de localização inválida: pode ser "hash" ou "path"');
                // eslint-disable-next-line unicorn/no-process-exit
                process.exit(-1);
            }
            return value;
        },
        required: false,
        description: 'Estratégia de localização para usar no roteador angular: "path" ou "hash"',
        defaults: 'path'
    },
    {
        name: 'git',
        type: 'Boolean',
        required: false,
        description: 'Inicialize o repositório git',
        defaults: true
    }
];