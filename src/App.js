import React from "react";
import "./App.css";
import imageCompression from "browser-image-compression";

export default class App extends React.Component {
  constructor(...args) {
    super(...args);
    this.compressImage = this.compressImage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.initializer = this.initializer.bind(this);
    this.state = {
      files: {},
      outputFiles: [],
      rendered: false,
      maxSizeKB: 5,
      maxWidthOrHeight: 20000,

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
      mainThread: { ...prevState.mainThread, progress: p },
    }));
  }

  async handleImageSelection(event, useWebWorker) {
    const files = event.target.files;
    console.log({ files: files });
    this.setState({ files: files });
  }

  initializer(event) {
    event.preventDefault();
    const filelist = [...this.state.files];

    console.log(filelist);
    filelist.forEach((fileLocation) => {
      this.compressImage(fileLocation, false);
    });
  }

  async compressImage(fileLocation, useWebWorker) {
    // const file = event.target.files[0];
    const file = fileLocation;

    console.log("input", file);
    console.log(
      "ExifOrientation",
      await imageCompression.getExifOrientation(file)
    );

    const targetName = "mainThread";
    const inputUrl = URL.createObjectURL(file);
    this.setState((prevState) => ({
      ...prevState,
      mainThread: {
        ...prevState.mainThread,
        inputSize: (file.size / 1024 / 1024).toFixed(2),
        inputUrl: inputUrl,
      },
    }));
    //todo: make this better:
    var options = {
      maxIteration: 100,
      alwaysKeepResolution: 1,
      maxSizeMB: this.state.maxSizeKB / 1024,

      useWebWorker,
      onProgress: (p) => this.onProgress(p, useWebWorker),
    };
    const output = await imageCompression(file, options);

    const compressedFile = {
      originalImage: inputUrl,
      name: output.name,
      url: URL.createObjectURL(output),
      inputSize: file.size,
      outputSize: output.size,
    };

    this.setState({ outputFiles: [...this.state.outputFiles, compressedFile] });

    console.log("output", output);
    this.setState({ fileName: output.name });
    this.setState((prevState) => ({
      ...prevState,
      mainThread: {
        ...prevState.mainThread,
        outputSize: (output.size / 1024 / 1024).toFixed(5),
        outputUrl: URL.createObjectURL(output),
      },
    }));
    console.log(this.state);
  }

  render() {
    const { mainThread, maxSizeKB } = this.state;
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
              multiple="multiple"
              type="file"
              accept="image/*"
              onChange={(e) => this.handleImageSelection(e, false)}
            />
            <input type="submit" onClick={this.initializer} />
          </label>

          <p>
            <table>
              {this.state.outputFiles.length > 0 &&
                this.state.outputFiles.map((element) => {
                  return (
                    <tr>
                      <td>
                        Source image size:
                        {(element.inputSize / 1024).toFixed(2)}
                        kb
                        <br />
                        <img src={element.originalImage} />
                      </td>
                      <td>
                        Output image size:
                        {(element.outputSize / 1024).toFixed(2)}
                        kb.{" "}
                        <a href={element.url} download={element.name}>
                          [download compressed image]
                        </a>
                        <br />
                        <img src={element.url} />
                      </td>
                    </tr>
                  );
                })}
            </table>
            <br />
            {mainThread.progress && this.state.rendered === false && (
              <span>Compressing... {mainThread.progress} %</span>
            )}
          </p>
        </div>
        {mainThread.inputUrl && this.state.rendered === true && (
          <table>
            <thead>
              <tr>
                <td>input preview</td>
                <td>
                  output preview{" "}
                  <a href={mainThread.outputUrl} download={this.state.fileName}>
                    [download compressed image]
                  </a>
                  <br />
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img src={mainThread.inputUrl} alt="input" />
                </td>
                <td>
                  <img src={mainThread.outputUrl} alt="output" />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  }
}
