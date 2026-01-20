from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

data = [(1, "Alice"), (2, "Bob")]
df = spark.createDataFrame(data, ["id", "name"])

df.show()
