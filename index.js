import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import AWS from 'aws-sdk';
import cryptoRandomString from 'crypto-random-string';

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

var ddb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ type: 'application/json' }))


app.get('/todos', async function (req, res) {
  try {
    const result = await ddb.scan({
      TableName: 'todos',
    }).promise()
    res.json(result.Items || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const pk = cryptoRandomString({ length: 10 });
    await ddb.put({
      TableName: 'todos',
      Item: {
        pk,
        content: req.body.content,
      }
    }).promise()
    res.json({ message: 'Todo created', pk });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/todos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await ddb.get({
      TableName: 'todos',
      Key: {
        pk: id,
      }
    }).promise()
    if (result.Item) {
      res.json(result.Item);
    } else {
      res.status(404).json({ message: 'Todo not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app
  .route('/edit/:id')
  .post(async (req, res) => {
    try {
      const id = req.params.id;
      await ddb.update({
        TableName: 'todos',
        Key: {
          pk: id,
        },
        UpdateExpression: 'set #cnt = :cnt',
        ExpressionAttributeNames: {
          '#cnt': 'content',
        },
        ExpressionAttributeValues: {
          ':cnt': req.body.content,
        }
      }).promise()
      res.json({ message: 'Todo updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

app.route('/remove/:id').get(async (req, res) => {
  try {
    const id = req.params.id;
    await ddb.delete({
      TableName: 'todos',
      Key: {
        pk: id,
      }
    }).promise()
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(3000, () => console.log('Server Up and running'));
