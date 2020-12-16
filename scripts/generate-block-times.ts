const fs = require('fs');
const { Contract } = require('../src/Contract')
const { HistoricEvents } = require('../src/historicEvents')
const { firstReplayBlock, lastReplayBlock } = require('../src/constants');

async function run() {
  let out: any[] = [];
  let contract = await Contract.create(true, true);

  let historicEvents = new HistoricEvents(firstReplayBlock, contract);

  for await (const { timestamp, blockNumber } of historicEvents) {
    console.log(blockNumber, timestamp, lastReplayBlock - blockNumber);
    out.push([blockNumber, timestamp]);
    if (blockNumber >= lastReplayBlock) {
      break;
    }
  }

  return out;
}

run()
  .then((blocks) => {
    fs.writeFileSync('../public/blocktimes.json', JSON.stringify(blocks), 'utf8')
  })
  .catch((err) => {
    console.log(err)
  })
