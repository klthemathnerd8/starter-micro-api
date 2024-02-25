const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = '!';

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'usaco') {
    try {
      let attempts = 0;
      let problemDescription;

      // Attempt to fetch a problem description, and retry if not found
      do {
        attempts++;
        const randomCpid = Math.floor(Math.random() * (2000 - 1000 + 1) + 1000);
        const problemURL = `https://usaco.org/index.php?page=viewproblem2&cpid=${randomCpid}`;

        console.log(`Attempting to fetch problem with cpid=${randomCpid}`);

        try {
          problemDescription = await fetchProblemDescription(problemURL);
        } catch (fetchError) {
          console.error(`Error fetching problem with cpid=${randomCpid}:`, fetchError);
          problemDescription = 'Problem text not found';
        }
      } while (problemDescription === 'Problem text not found' && attempts < 1000);

      if (problemDescription !== 'Problem text not found') {
        // Split the problem description into chunks (max 2000 characters per message)
        const chunks = problemDescription.match(/.{1,2000}/g) || [];
        for (const chunk of chunks) {
          message.channel.send(chunk);
        }
      } else {
        message.channel.send('Unable to fetch USACO problem. Please try again later.');
      }
    } catch (error) {
      console.error('Unexpected error fetching USACO problem:', error);
      message.channel.send('Unexpected error fetching USACO problem. Please try again later.');
    }
  }
});

async function fetchProblemDescription(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  let problemText = $('.problem-text').text().trim();

  // Remove unnecessary '\n' characters
  problemText = problemText.replace(/\n{2,}/g, '\n'); // Replace consecutive '\n' with a single '\n'
  problemText = problemText.replace(/^\n+/g, ''); // Remove leading '\n'

  // Find the index of "SAMPLE INPUT"
  const sampleInputIndex = problemText.indexOf("SAMPLE INPUT");

  // Split the problem into two parts based on "SAMPLE INPUT"
  const part1 = problemText.substring(0, sampleInputIndex).trim();
  const part2 = problemText.substring(sampleInputIndex).trim();

  // Combine parts until exceeding 2000 characters, then send
  const combinedParts = [];
  let currentMessage = '';

  for (const part of [part1, part2]) {
    if ((currentMessage + part).length <= 2000) {
      currentMessage += part;
    } else {
      combinedParts.push(currentMessage);
      currentMessage = part;
    }
  }

  // If there's any remaining message, add it to the combined parts
  if (currentMessage.length > 0) {
    combinedParts.push(currentMessage);
  }

  // Log or send combined parts separately
  for (const chunk of combinedParts) {
    console.log('Chunk:', chunk);
    // If you want to send chunks, use message.channel.send(chunk);
  }

  return problemText || 'Problem text not found';
}

const mySecret = process.env.YOUR_BOT_TOKEN;
client.login(mySecret)
  .then(() => {
    console.log('Bot logged in successfully!');
  })
  .catch((error) => {
    console.error('Error logging in:', error);
  });
