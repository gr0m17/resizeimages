import React from "react";
import "./App.css";
import imageCompression from "browser-image-compression";

export default class App extends React.Component {
  constructor(...args) {
    super(...args);
    this.compressImage = this.compressImage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      rendered: false,
      maxSizeKB: 5,
      maxWidthOrHeight: 20000,
      webWorker: {
        fileName: null,
        progress: null,
        inputSize: null,
        outputSize: null,
        inputUrl: null,
        outputUrl: null,
      },
      mainThread: {
        progress: null,
        inputSize: null,
        outputSize: null,
        inputUrl: null,
        outputUrl: null,
      },
    };
  }

  handleChange(target) {
    return (e) => {
      this.setState({ [target]: e.currentTarget.value });
    };
  }

  handleSizeChange(target) {
    const rendered = this.state.rendered;
    return (e) => {
      this.setState({ [target]: e.currentTarget.value });
      if (rendered) {
        console.log("rerender?");
        this.setState({ rendered: false });
      }
    };
  }

  onProgress(p, useWebWorker) {
    const targetName = useWebWorker ? "webWorker" : "mainThread";
    this.setState((prevState) => ({
      ...prevState,
      [targetName]: {git
        ...prevState[targetName],
        progress: p,
      },
    }));
  }

  async compressImage(event, useWebWorker) {
    this.setState({ rendered: false });
    const file = event.target.files[0];
    console.log("input", file);
    console.log(
      "ExifOrientation",
      await imageCompression.getExifOrientation(file)
    );
    const targetName = useWebWorker ? "webWorker" : "mainThread";
    this.setState((prevState) => ({
      ...prevState,
      [targetName]: {
        ...prevState[targetName],
        inputSize: (file.size / 1024 / 1024).toFixed(2),
        inputUrl: URL.createObjectURL(file),
      },
    }));
    var options = {
      maxIteration: 100,
      alwaysKeepResolution: 1,
      maxSizeMB: this.state.maxSizeKB / 1024,

      useWebWorker,
      onProgress: (p) => this.onProgress(p, useWebWorker),
    };
    const output = await imageCompression(file, options);
    console.log("output", output);
    this.setState({ fileName: output.name });
    this.setState({ rendered: true });
    this.setState((prevState) => ({
      ...prevState,
      [targetName]: {
        ...prevState[targetName],
        outputSize: (output.size / 1024 / 1024).toFixed(5),
        outputUrl: URL.createObjectURL(output),
      },
    }));
  }

  render() {
    const { webWorker, mainThread, maxSizeKB } = this.state;
    return (
      <div className="App">
        <div>
          Options:
          <br />
          <label htmlFor="maxSizeKB">
            max file size in kb:
            <input
              type="number"
              id="maxSizeKB"
              name="maxSizeKB"
              value={maxSizeKB}
              onChange={this.handleSizeChange("maxSizeKB")}
            />
          </label>
          <br />
          <hr />
        </div>
        <div>
          <label htmlFor="main-thread">
            Browsers based compression{" "}
            <input
              id="main-thread"
              type="file"
              accept="image/*"
              onChange={(e) => this.compressImage(e, false)}
            />
          </label>
          <p>
            {" "}
            {mainThread.inputSize && (
              <span>Source image size: {mainThread.inputSize * 1024} kb</span>
            )}
            <br />
            {mainThread.progress && this.state.rendered === false && (
              <span>Compressing... {mainThread.progress} %</span>
            )}
            {mainThread.outputSize && this.state.rendered === true && (
              <span>
                Output image size: {mainThread.outputSize * 1024} kb.
                <br /> compressed size:
                {(mainThread.outputSize / mainThread.inputSize).toFixed(2)}% of
                original!
                <br />
                Maximum filesize:{maxSizeKB} KB
                <br /> actual achieved size:
                {Math.round(mainThread.outputSize * 1024)} KB
                <br />
                {Math.round(mainThread.outputSize * 1024) > maxSizeKB
                  ? "Error: Failed to compress to desired file size."
                  : "success!"}
              </span>
            )}
          </p>
        </div>
        {(mainThread.inputUrl || webWorker.inputUrl) &&
          this.state.rendered === true && (
            <table>
              <thead>
                <tr>
                  <td>input preview</td>
                  <td>
                    output preview{" "}
                    <a
                      href={mainThread.outputUrl}
                      download={this.state.fileName}
                    >
                      [download compressed image]
                    </a>
                    <br />
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <img
                      src={mainThread.inputUrl || webWorker.inputUrl}
                      alt="input"
                    />
                  </td>
                  <td>
                    <img
                      src={mainThread.outputUrl || webWorker.outputUrl}
                      alt="output"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          )}
      </div>
    );
  }
}
