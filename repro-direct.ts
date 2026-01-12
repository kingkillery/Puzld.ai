
import { ralphCommand } from "./src/cli/commands/ralph";

async function test() {
  console.log("Testing with iterations='abc'");
  // Mock process.exit to avoid killing the test runner
  const originalExit = process.exit;
  (process as any).exit = (code: number) => {
    console.log(`Process exited with code ${code}`);
    throw new Error(`Exit ${code}`);
  };

  try {
    await ralphCommand("test", { iterations: "abc" });
  } catch (e: any) {
    console.log(`Caught: ${e.message}`);
  } finally {
    process.exit = originalExit;
  }
}

test();
