const GetPath = require('./GetPath');
const SkipBlock = require('./SkipBlock');
const HasTag = require('./HasTag');
const { clear } = require('jsdoc-to-markdown');

let id_generator = 0;

let InsertMember = function (db, data)
{
    const memberTransaction = db.prepare(`INSERT INTO members (
        longname,
        since,
        name,
        memberof,
        description,
        type,
        defaultValue,
        readOnly,
        scope,
        metafilename,
        metalineno,
        metapath,
        webgl,
        inherited,
        inherits,
        nullable,
        overrides
    ) VALUES (
        @longname,
        @since,
        @name,
        @memberof,
        @description,
        @type,
        @defaultValue,
        @readOnly,
        @scope,
        @metafilename,
        @metalineno,
        @metapath,
        @webgl,
        @inherited,
        @inherits,
        @nullable,
        @overrides
    )`);

    const insertMany = db.transaction((transaction, queries) => {
        for (const query of queries)
        {
            transaction.run(query);
        }
    });

    let memberQueries = [];

    for (let i = 0; i < data.docs.length; i++)
    {
        let block = data.docs[i];
        
        if (SkipBlock('member', block))
        {
            continue;
        }
        
        if (block.scope === 'global' && block.longname === block.name)
        {
            //  Global function skip
            continue;
        }

        for(let x = 0; x < data.docs.length; x++) {
            if(block.longname == data.docs[x].longname && x !== i) {
                block.longname = block.longname + `[${id_generator++}]`;
                console.log(block.longname);
            }
        }
        
        memberQueries.push({
            longname: block.longname,
            since: (block.hasOwnProperty('since')) ? block.since : '3.0.0',
            name: block.name,
            memberof: block.memberof,
            description: block.description,
            type: (block.hasOwnProperty('type')) ? block.type.names.join(' | ') : '',
            defaultValue: (block.hasOwnProperty('defaultvalue')) ? block.defaultvalue : '',
            readOnly: (block.hasOwnProperty('readonly') && block.readonly) ? 1 : 0,
            scope: block.scope,
            metafilename: block.meta.filename,
            metalineno: block.meta.lineno,
            metapath: GetPath(block.meta.path),
            webgl: HasTag(block, 'webglOnly'),
            inherited: (block.hasOwnProperty('inherited') && block.inherited) ? 1 : 0,
            inherits: (block.hasOwnProperty('inherits') && block.inherited) ? block.inherits : '',
            nullable: (block.hasOwnProperty('nullable') && block.nullable) ? 1 : 0,
            overrides: (block.hasOwnProperty('overrides') && block.overrides) ? block.overrides : ''
        });
    }

    if (memberQueries.length)
    {
        insertMany(memberTransaction, memberQueries);
    }
};

module.exports = InsertMember;
