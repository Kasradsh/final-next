import React, { useState,useEffect,useRef} from "react";
import axios from "axios";
import Link from "next/link";
import AWS from 'aws-sdk';
import styles from '../styles/ProtectedPage.module.css';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';

function ProtectedPage() {
  var { isLoading , user, error}= useUser()
  let [count,setCount] = useState(0);
  user?console.log(user):console.log("nothing yet")
  const [imageUrls, setImageUrls] = useState([]);
  const [file, setFile] = useState();
  const [uploadingStatus, setUploadingStatus] = useState();

  const selectFile = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadFile = async () => {
    setUploadingStatus("Uploading the file to AWS S3");

    let { data } = await axios.post("/api/upload", {
      name: file.name,
      type: file.type,
    });

    console.log(data);

    const url = data.url;
    let { data: newData } = await axios.put(url, file, {
      headers: {
        "Content-type": file.type,
        "Access-Control-Allow-Origin": "*",
      },
    });

    setFile(null);
    setCount(++count)
    console.log(count)
  };
  const s3 = new AWS.S3({
    accessKeyId: "AKIAWZATVY7MB4BXAOIG",
    secretAccessKey: "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",
    region: "us-east-1",
  });
  
  const getImageUrlsFromS3 = async () => {
    const params = {
      Bucket: 'chefomardee-testing',
    };
  
    try {
      const response = await s3.listObjectsV2(params).promise();
      var images = response.Contents.filter((file) =>
        file.Key.startsWith(user.sub) &&
          ['.jpg', '.jpeg', '.png', '.gif'].includes(
            file.Key.substring(file.Key.lastIndexOf('.'))
          )
        );         
  
      const imageUrls = images.map((image) =>
        s3.getSignedUrl('getObject', {
          Bucket: params.Bucket,
          Key: image.Key,
        })
      );
      console.log(imageUrls)
      return imageUrls;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  useEffect(() => {
    async function fetchData() {
      if(user){
        const urls = await getImageUrlsFromS3();
        setImageUrls(urls);
      }
    }
    fetchData();
  }, [user, count]);

  return (
<div className="container flex items-center p-4 mx-auto min-h-screen justify-center">
  {/* File Upload Section */}
  <main>
    <p>Please select a file to upload</p>
    <input type="file" onChange={(e) => selectFile(e)} />
    {file && (
      <>
        <p>Selected file: {file.name}</p>
        <button
          onClick={uploadFile}
          className=" bg-purple-500 text-white p-2 rounded-sm shadow-md hover:bg-purple-700 transition-all"
        >
          Upload a File!
        </button>
      </>
    )}
    {uploadingStatus && <p>{uploadingStatus}</p>}
  </main>

  {/* Uploaded Images Section */}
  <div className={styles.container}>
    {imageUrls.map((url) => (
      <React.Fragment key={url}>
        {/* <a href={url} className={styles.a}>
          import Link from 'next/link' */}

      <Link
        href={{
          pathname: '/image',
          query: {
            imgname:url,
          } // the data
        }}
      >
      <img src={url} className={styles.img} alt="uploaded image"  />
      </Link>

      </React.Fragment>
    ))}
  </div>
</div>
  );
}
export const getServerSideProps = withPageAuthRequired()
export default ProtectedPage