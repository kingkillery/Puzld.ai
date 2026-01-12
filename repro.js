
const { ralphCommand } = require('./dist/cli/commands/ralph');

async function test() {
  console.log("Testing with iterations='abc'");
  try {
    await ralphCommand("test", { iterations: "abc" });
    console.log("FAILED: Should have exited");
  } catch (e) {
    console.log("SUCCESS: Caught error/exit");
  }
}

test();
